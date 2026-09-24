import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
	createGitHubDeployment,
	createJobSummary,
	createPreviewGitHubDeploymentAndJobSummary,
} from "./github";
import * as actionsGithub from "@actions/github";
import { mockGithubDeployments } from "../test/mocks";
import { getTestConfig } from "../test/test-utils";
import mockfs from "mock-fs";
import { readFile } from "fs/promises";

// Keep the real implementation available after getOctokit is mocked below.
const actualGetOctokit = actionsGithub.getOctokit;

afterEach(() => {
	mockfs.restore();
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe("github", () => {
	it("Calls createGitHubDeployment successfully", async () => {
		const githubUser = "mock-user";
		const githubRepoName = "wrangler-action";
		const server = setupServer(
			...mockGithubDeployments({ githubUser, githubRepoName }).handlers,
		);
		server.listen({ onUnhandledRequest: "error" });
		vi.stubEnv("GITHUB_REPOSITORY", `${githubUser}/${githubRepoName}`);

		const testConfig = getTestConfig();
		const octokit = actualGetOctokit(testConfig.GITHUB_TOKEN, {
			request: fetch,
		});
		await createGitHubDeployment({
			config: testConfig,
			octokit,
			productionBranch: "production-branch",
			deploymentId: "fake-deployment-id",
			projectName: "fake-project-name",
			deploymentUrl: "https://fake-deployment-url.com",
			environment: "production",
		});
		server.close();
	});
	it("Calls createJobSummary successfully", async () => {
		vi.stubEnv("GITHUB_STEP_SUMMARY", "summary");
		mockfs({
			summary: mockfs.file(),
		});
		await createJobSummary({
			commitHash: "fake-commit-hash",
			deploymentUrl: "https://fake-deployment-url.com",
			aliasUrl: "https://fake-alias-url.com",
		});
		expect((await readFile("summary")).toString()).toMatchInlineSnapshot(`
			"
			# Deploying with Cloudflare Pages

			| Name                    | Result |
			| ----------------------- | - |
			| **Last commit:**        | fake-commit-hash |
			| **Preview URL**:        | https://fake-deployment-url.com |
			| **Branch Preview URL**: | https://fake-alias-url.com |
			  "
		`);
	});

	it("does not create a preview deployment without a GitHub token", async () => {
		const server = setupServer();
		server.listen({ onUnhandledRequest: "error" });

		try {
			await createPreviewGitHubDeploymentAndJobSummary(
				getTestConfig({ config: { GITHUB_TOKEN: "" } }),
				{
					version: 1,
					type: "preview",
					worker_name: "example-worker",
					preview_id: "preview-id",
					preview_name: "feature-branch",
					preview_slug: "feature-branch",
					preview_urls: ["https://feature-branch.example-worker.workers.dev"],
					deployment_id: "deployment-id",
					deployment_urls: ["https://deployment-id.example-worker.workers.dev"],
				},
			);
		} finally {
			server.close();
		}
	});

	it("creates a non-production preview deployment and job summary", async () => {
		const githubUser = "mock-user";
		const githubRepoName = "wrangler-action";
		let deploymentRequest: Record<string, unknown> | undefined;
		let statusRequest: Record<string, unknown> | undefined;
		const server = setupServer(
			http.post(
				`https://api.github.com/repos/${githubUser}/${githubRepoName}/deployments`,
				async ({ request }) => {
					deploymentRequest = (await request.json()) as Record<string, unknown>;
					return HttpResponse.json({ id: 123 }, { status: 201 });
				},
			),
			http.post(
				`https://api.github.com/repos/${githubUser}/${githubRepoName}/deployments/123/statuses`,
				async ({ request }) => {
					statusRequest = (await request.json()) as Record<string, unknown>;
					return HttpResponse.json({}, { status: 201 });
				},
			),
		);
		server.listen({ onUnhandledRequest: "error" });
		vi.spyOn(actionsGithub, "getOctokit").mockImplementation((token) =>
			actualGetOctokit(token, { request: fetch }),
		);
		vi.stubEnv("GITHUB_REPOSITORY", `${githubUser}/${githubRepoName}`);
		vi.stubEnv("GITHUB_HEAD_REF", "feature/branch");
		vi.stubEnv("GITHUB_REF_NAME", "feature/branch");
		vi.stubEnv("GITHUB_STEP_SUMMARY", "summary");
		mockfs({ summary: mockfs.file() });

		try {
			await createPreviewGitHubDeploymentAndJobSummary(getTestConfig(), {
				version: 1,
				type: "preview",
				worker_name: "example-worker",
				preview_id: "preview-id",
				preview_name: "PR / Feature",
				preview_slug: "feature branch/one",
				preview_urls: ["https://feature.example-worker.workers.dev"],
				deployment_id: "deployment/id",
				deployment_urls: ["https://deployment.example-worker.workers.dev"],
			});

			expect(deploymentRequest).toMatchObject({
				ref: "feature/branch",
				description: "Cloudflare Workers Preview",
				environment: "PR / Feature",
				production_environment: false,
			});
			expect(statusRequest).toMatchObject({
				environment: "PR / Feature",
				environment_url: "https://feature.example-worker.workers.dev",
				production_environment: false,
				log_url:
					"https://dash.cloudflare.com/bar/?to=/bar/workers/services/view/example-worker/production/previews/feature%20branch%2Fone/deployments/deployment%2Fid",
			});
			expect((await readFile("summary")).toString()).toContain(
				"https://feature.example-worker.workers.dev",
			);
			expect((await readFile("summary")).toString()).toContain(
				"https://deployment.example-worker.workers.dev",
			);
			expect((await readFile("summary")).toString()).toContain(
				"**Unique Deployment URL:**",
			);
		} finally {
			server.close();
		}
	});
});
