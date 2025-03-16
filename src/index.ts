import { getBooleanInput, getInput, getMultilineInput } from "@actions/core";
import { tmpdir } from "os";
import { join } from "path";
import { getPackageManager } from "./packageManagers";
import { checkWorkingDirectory } from "./utils";
import { main, WranglerActionConfig } from "./wranglerAction";

const DEFAULT_WRANGLER_VERSION = "3.90.0";

/**
 * A configuration object that contains all the inputs & immutable state for the action.
 */
const config: WranglerActionConfig = {
	WRANGLER_VERSION: getInput("wranglerVersion") || DEFAULT_WRANGLER_VERSION,
	didUserProvideWranglerVersion: Boolean(getInput("wranglerVersion")),
	secrets: getMultilineInput("secrets"),
	workingDirectory: checkWorkingDirectory(getInput("workingDirectory")),
	CLOUDFLARE_API_TOKEN: getInput("apiToken"),
	CLOUDFLARE_ACCOUNT_ID: getInput("accountId"),
	ENVIRONMENT: getInput("environment"),
	VARS: getMultilineInput("vars"),
	COMMANDS: getMultilineInput("command"),
	QUIET_MODE: getBooleanInput("quiet"),
	PACKAGE_MANAGER: getInput("packageManager"),
	WRANGLER_OUTPUT_DIR: `${join(
		tmpdir(),
		`wranglerArtifacts-${crypto.randomUUID()}`,
	)}`,
	GITHUB_TOKEN: getInput("gitHubToken"),
	DEPLOYMENT_NAME: getInput("deploymentName"),
} as const;

const packageManager = getPackageManager(config.PACKAGE_MANAGER, {
	workingDirectory: config.workingDirectory,
});

main(config, packageManager);
