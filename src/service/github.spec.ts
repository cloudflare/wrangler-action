import { afterEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import {
	createGitHubDeployment,
	createGitHubDeploymentAndJobSummary,
	createJobSummary,
} from "./github";
import { getOctokit } from "@actions/github";
import { mockGithubDeployments } from "../test/mocks";
import { getTestConfig } from "../test/test-utils";
import mockfs from "mock-fs";
import { readFile } from "fs/promises";
import * as core from "@actions/core";

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

	describe("createGitHubDeploymentAndJobSummary", () => {
		it("Skips when GITHUB_TOKEN is empty", async () => {
			const testConfig = getTestConfig({
				config: { GITHUB_TOKEN: "" },
			});
			const warnSpy = vi.spyOn(core, "warning");

			await createGitHubDeploymentAndJobSummary(testConfig, {
				version: 1,
				type: "pages-deploy-detailed",
				pages_project: "project",
				environment: "production",
				deployment_id: "123",
				url: "https://example.com",
				alias: "https://alias.example.com",
				production_branch: "main",
				deployment_trigger: {
					metadata: { commit_hash: "abc12345678" },
				},
			});

			// Should not warn (it just skips silently)
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it("Skips when production_branch is missing", async () => {
			const testConfig = getTestConfig();
			const warnSpy = vi.spyOn(core, "warning");

			await createGitHubDeploymentAndJobSummary(testConfig, {
				version: 1,
				type: "pages-deploy-detailed",
				pages_project: "project",
				environment: "production",
				deployment_id: "123",
				url: "https://example.com",
				alias: "https://alias.example.com",
			});

			expect(warnSpy).not.toHaveBeenCalled();
		});

		it("Skips when pages_project is null", async () => {
			const testConfig = getTestConfig();
			const warnSpy = vi.spyOn(core, "warning");

			await createGitHubDeploymentAndJobSummary(testConfig, {
				version: 1,
				type: "pages-deploy-detailed",
				pages_project: null,
				environment: "production",
				deployment_id: "123",
				url: "https://example.com",
				production_branch: "main",
				deployment_trigger: {
					metadata: { commit_hash: "abc12345678" },
				},
			});

			expect(warnSpy).not.toHaveBeenCalled();
		});

		it("Skips when deployment_trigger is missing", async () => {
			const testConfig = getTestConfig();
			const warnSpy = vi.spyOn(core, "warning");

			await createGitHubDeploymentAndJobSummary(testConfig, {
				version: 1,
				type: "pages-deploy-detailed",
				pages_project: "project",
				environment: "production",
				deployment_id: "123",
				url: "https://example.com",
				production_branch: "main",
			});

			expect(warnSpy).not.toHaveBeenCalled();
		});
	});
});
