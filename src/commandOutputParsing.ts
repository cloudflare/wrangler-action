import { setOutput } from "@actions/core";
import { info, WranglerActionConfig } from "./wranglerAction";
import {
	getOutputEntry,
	OutputEntryDeployment,
	OutputEntryPagesDeployment,
	OutputEntryVersionUpload,
} from "./wranglerArtifactManager";
import { createGitHubDeploymentAndJobSummary } from "./service/github";

// fallback to trying to extract the deployment-url and pages-deployment-alias-url from stdout for wranglerVersion < 3.81.0
function extractDeploymentUrlsFromStdout(stdOut: string): {
	deploymentUrl?: string;
	aliasUrl?: string;
} {
	let deploymentUrl = "";
	let aliasUrl = "";

	// Try to extract the deployment URL
	const deploymentUrlMatch = stdOut.match(/https?:\/\/[a-zA-Z0-9-./]+/);
	if (deploymentUrlMatch && deploymentUrlMatch[0]) {
		deploymentUrl = deploymentUrlMatch[0].trim();
	}

	// And also try to extract the alias URL (since wrangler@3.78.0)
	const aliasUrlMatch = stdOut.match(/alias URL: (https?:\/\/[a-zA-Z0-9-./]+)/);
	if (aliasUrlMatch && aliasUrlMatch[1]) {
		aliasUrl = aliasUrlMatch[1].trim();
	}

	return { deploymentUrl, aliasUrl };
}

async function handlePagesDeployOutputEntry(
	config: WranglerActionConfig,
	pagesDeployOutputEntry: OutputEntryPagesDeployment,
) {
	setOutput("deployment-url", pagesDeployOutputEntry.url);
	// DEPRECATED: deployment-alias-url in favour of pages-deployment-alias, drop in next wrangler-action major version change
	setOutput("deployment-alias-url", pagesDeployOutputEntry.alias);
	setOutput("pages-deployment-alias-url", pagesDeployOutputEntry.alias);
	setOutput("pages-deployment-id", pagesDeployOutputEntry.deployment_id);
	setOutput("pages-environment", pagesDeployOutputEntry.environment);

	// Create github deployment, if GITHUB_TOKEN is present in config
	await createGitHubDeploymentAndJobSummary(config, pagesDeployOutputEntry);
}

/**
 * If no wrangler output file found, fallback to extracting deployment-url from stdout.
 * @deprecated Use {@link handlePagesDeployOutputEntry} instead.
 */
function handlePagesDeployCommand(
	config: WranglerActionConfig,
	stdOut: string,
) {
	info(
		config,
		"Unable to find a WRANGLER_OUTPUT_DIR, environment and id fields will be unavailable for output. Have you updated wrangler to version >=3.81.0?",
	);
	// DEPRECATED: deployment-alias-url in favour of pages-deployment-alias, drop in next wrangler-action major version change
	const { deploymentUrl, aliasUrl } = extractDeploymentUrlsFromStdout(stdOut);

	setOutput("deployment-url", deploymentUrl);
	// DEPRECATED: deployment-alias-url in favour of pages-deployment-alias, drop in next wrangler-action major version change
	setOutput("deployment-alias-url", aliasUrl);
	setOutput("pages-deployment-alias-url", aliasUrl);
}

function handleWranglerDeployOutputEntry(
	config: WranglerActionConfig,
	wranglerDeployOutputEntry: OutputEntryDeployment,
) {
	// If no deployment urls found in wrangler output file, log that we couldn't find any urls and return.
	if (
		!wranglerDeployOutputEntry.targets ||
		wranglerDeployOutputEntry.targets.length === 0
	) {
		info(config, "No deployment-url found in wrangler deploy output file");
		return;
	}

	// If more than 1 deployment url found, log that we're going to set deployment-url to the first match.
	// In a future wrangler-action version we should consider how we're going to output multiple deployment-urls
	if (wranglerDeployOutputEntry.targets.length > 1) {
		info(
			config,
			"Multiple deployment urls found in wrangler deploy output file, deployment-url will be set to the first url",
		);
	}

	setOutput("deployment-url", wranglerDeployOutputEntry.targets[0]);
}

/**
 * If no wrangler output file found, fallback to extracting deployment-url from stdout.
 * @deprecated Use {@link handleWranglerDeployOutputEntry} instead.
 */
function handleWranglerDeployCommand(
	config: WranglerActionConfig,
	stdOut: string,
) {
	info(
		config,
		"Unable to find a WRANGLER_OUTPUT_DIR, deployment-url may have an unreliable output. Have you updated wrangler to version >=3.88.0?",
	);
	const { deploymentUrl } = extractDeploymentUrlsFromStdout(stdOut);
	setOutput("deployment-url", deploymentUrl);
}

function handleVersionsUploadOutputEntry(
	versionsOutputEntry: OutputEntryVersionUpload,
) {
	setOutput("deployment-url", versionsOutputEntry.preview_url);
}

/**
 * If no wrangler output file found, log a message stating deployment-url will be unavailable for output.
 * @deprecated Use {@link handleVersionsOutputEntry} instead.
 */
function handleVersionsOutputCommand(config: WranglerActionConfig) {
	info(
		config,
		"Unable to find a WRANGLER_OUTPUT_DIR, deployment-url will be unavailable for output. Have you updated wrangler to version >=3.88.0?",
	);
}

function handleDeprecatedStdoutParsing(
	config: WranglerActionConfig,
	command: string,
	stdOut: string,
) {
	// Check if this command is a pages deployment
	if (
		command.startsWith("pages deploy") ||
		command.startsWith("pages publish")
	) {
		handlePagesDeployCommand(config, stdOut);
		return;
	}

	// Check if this command is a workers deployment
	if (command.startsWith("deploy") || command.startsWith("publish")) {
		handleWranglerDeployCommand(config, stdOut);
		return;
	}

	// Check if this command is a versions deployment
	if (command.startsWith("versions upload")) {
		handleVersionsOutputCommand(config);
		return;
	}
}

export async function handleCommandOutputParsing(
	config: WranglerActionConfig,
	command: string,
	stdOut: string,
) {
	// get first OutputEntry found within wrangler artifact output directory
	const outputEntry = await getOutputEntry(config.WRANGLER_OUTPUT_DIR);

	if (outputEntry === null) {
		// if no outputEntry found, fallback to deprecated stdOut parsing
		handleDeprecatedStdoutParsing(config, command, stdOut);
		return;
	}

	switch (outputEntry.type) {
		case "pages-deploy-detailed":
			await handlePagesDeployOutputEntry(config, outputEntry);
			break;
		case "deploy":
			handleWranglerDeployOutputEntry(config, outputEntry);
			break;
		case "version-upload":
			handleVersionsUploadOutputEntry(outputEntry);
			break;
	}
}
