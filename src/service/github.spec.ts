import { afterEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { createGitHubDeployment, createJobSummary } from "./github";
import { getOctokit } from "@actions/github";
import { mockGithubDeployments } from "../test/mocks";
import { getTestConfig } from "../test/test-utils";
import mockfs from "mock-fs";
import { readFile } from "fs/promises";

afterEach(() => {
	mockfs.restore();
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
		const octokit = getOctokit(testConfig.GITHUB_TOKEN, { request: fetch });
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
});
