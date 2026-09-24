import { summary } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { env } from "process";
import { info, warn } from "../utils";
import {
	OutputEntryPagesDeployment,
	OutputEntryPreview,
} from "../wranglerArtifactManager";
import { WranglerActionConfig } from "../wranglerAction";

type Octokit = ReturnType<typeof getOctokit>;

export async function createGitHubDeployment({
	config,
	octokit,
	productionBranch,
	environment,
	deploymentId,
	projectName,
	deploymentUrl,
}: {
	config: WranglerActionConfig;
	octokit: Octokit;
	productionBranch: string;
	environment: string;
	deploymentId: string | null;
	projectName: string;
	deploymentUrl?: string;
}) {
	const githubBranch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
	const productionEnvironment = githubBranch === productionBranch;

	const deployment = await octokit.rest.repos.createDeployment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		ref: githubBranch || context.ref,
		auto_merge: false,
		description: "Cloudflare Pages",
		required_contexts: [],
		environment,
		production_environment: productionEnvironment,
	});

	if (deployment.status !== 201) {
		info(config, "Error creating GitHub deployment");
		return;
	}
	await octokit.rest.repos.createDeploymentStatus({
		owner: context.repo.owner,
		repo: context.repo.repo,
		deployment_id: deployment.data.id,
		environment,
		environment_url: deploymentUrl,
		production_environment: productionEnvironment,
		// don't have project_name or deployment_id I think
		log_url: `https://dash.cloudflare.com/${config.CLOUDFLARE_ACCOUNT_ID}/pages/view/${projectName}/${deploymentId}`,
		description: "Cloudflare Pages",
		state: "success",
		auto_inactive: false,
	});
}

export async function createJobSummary({
	commitHash,
	deploymentUrl,
	aliasUrl,
}: {
	commitHash: string;
	deploymentUrl?: string;
	aliasUrl?: string;
}) {
	await summary
		.addRaw(
			`
# Deploying with Cloudflare Pages

| Name                    | Result |
| ----------------------- | - |
| **Last commit:**        | ${commitHash} |
| **Preview URL**:        | ${deploymentUrl} |
| **Branch Preview URL**: | ${aliasUrl} |
  `,
		)
		.write();
}

/**
 * Create github deployment, if GITHUB_TOKEN is present in config
 */
export async function createGitHubDeploymentAndJobSummary(
	config: WranglerActionConfig,
	pagesArtifactFields: OutputEntryPagesDeployment,
) {
	if (
		config.GITHUB_TOKEN &&
		pagesArtifactFields.production_branch &&
		pagesArtifactFields.pages_project &&
		pagesArtifactFields.deployment_trigger
	) {
		const octokit = getOctokit(config.GITHUB_TOKEN);
		const [createGitHubDeploymentRes, createJobSummaryRes] =
			await Promise.allSettled([
				createGitHubDeployment({
					config,
					octokit,
					deploymentUrl: pagesArtifactFields.url,
					productionBranch: pagesArtifactFields.production_branch,
					environment: pagesArtifactFields.environment,
					deploymentId: pagesArtifactFields.deployment_id,
					projectName: pagesArtifactFields.pages_project,
				}),
				createJobSummary({
					commitHash:
						pagesArtifactFields.deployment_trigger.metadata.commit_hash.substring(
							0,
							8,
						),
					deploymentUrl: pagesArtifactFields.url,
					aliasUrl: pagesArtifactFields.alias,
				}),
			]);

		if (createGitHubDeploymentRes.status === "rejected") {
			warn(config, "Creating Github Deployment failed");
		}

		if (createJobSummaryRes.status === "rejected") {
			warn(config, "Creating Github Job summary failed");
		}
	}
}

export async function createPreviewJobSummary({
	previewName,
	previewUrl,
	deploymentUrl,
	workerName,
}: {
	previewName: string;
	previewUrl?: string;
	deploymentUrl?: string;
	workerName: string;
}) {
	await summary
		.addRaw(
			`
# Workers Preview Deployment

| Name                       | Result |
| -------------------------- | - |
| **Worker:**                | ${workerName} |
| **Preview:**               | ${previewName} |
| **Preview URL:**           | ${previewUrl ?? "N/A"} |
| **Unique Deployment URL:** | ${deploymentUrl ?? "N/A"} |
  `,
		)
		.write();
}

/**
 * Create a non-production GitHub deployment and job summary for a Workers Preview.
 */
export async function createPreviewGitHubDeploymentAndJobSummary(
	config: WranglerActionConfig,
	previewFields: OutputEntryPreview,
) {
	if (!config.GITHUB_TOKEN) {
		return;
	}

	const octokit = getOctokit(config.GITHUB_TOKEN);
	const githubBranch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
	const environment = previewFields.preview_name;
	const productionEnvironment = false;

	const [createDeploymentRes, createSummaryRes] = await Promise.allSettled([
		(async () => {
			const deployment = await octokit.rest.repos.createDeployment({
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: githubBranch || context.ref,
				auto_merge: false,
				description: "Cloudflare Workers Preview",
				required_contexts: [],
				environment,
				production_environment: productionEnvironment,
			});

			if (deployment.status !== 201) {
				info(config, "Error creating GitHub deployment for preview");
				return;
			}

			await octokit.rest.repos.createDeploymentStatus({
				owner: context.repo.owner,
				repo: context.repo.repo,
				deployment_id: deployment.data.id,
				environment,
				environment_url: previewFields.preview_urls[0],
				production_environment: productionEnvironment,
				log_url: `https://dash.cloudflare.com/${config.CLOUDFLARE_ACCOUNT_ID}/?to=/${config.CLOUDFLARE_ACCOUNT_ID}/workers/services/view/${previewFields.worker_name}/production/previews/${encodeURIComponent(previewFields.preview_slug)}/deployments/${encodeURIComponent(previewFields.deployment_id)}`,
				description: "Cloudflare Workers Preview",
				state: "success",
				auto_inactive: false,
			});
		})(),
		createPreviewJobSummary({
			previewName: previewFields.preview_name,
			previewUrl: previewFields.preview_urls[0],
			deploymentUrl: previewFields.deployment_urls[0],
			workerName: previewFields.worker_name,
		}),
	]);

	if (createDeploymentRes.status === "rejected") {
		warn(config, "Creating Github Deployment for preview failed");
	}

	if (createSummaryRes.status === "rejected") {
		warn(config, "Creating Github Job summary for preview failed");
	}
}
