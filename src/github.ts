import { summary } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { env } from "process";
import { WranglerActionConfig } from "./wranglerAction";

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

	if (deployment.status === 201) {
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
