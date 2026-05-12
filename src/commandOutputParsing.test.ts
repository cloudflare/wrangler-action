import * as core from "@actions/core";
import mockfs from "mock-fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCommandOutputParsing } from "./commandOutputParsing";
import { getTestConfig } from "./test/test-utils";

vi.mock("./service/github", () => ({
	createGitHubDeploymentAndJobSummary: vi.fn(),
}));

afterEach(() => {
	mockfs.restore();
	vi.restoreAllMocks();
});

describe("handleCommandOutputParsing", () => {
	describe("with pages-deploy-detailed output entry", () => {
		it("Sets pages deployment outputs from artifact file", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["pages","deploy"], "log_file_path": "/here"}
{"version": 1, "type":"pages-deploy-detailed", "pages_project": "my-project", "environment":"production", "alias":"https://alias.example.com", "deployment_id": "abc-123", "url":"https://my-project.pages.dev"}`,
				},
			});

			await handleCommandOutputParsing(
				testConfig,
				"pages deploy ./dist",
				"some stdout",
			);

			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://my-project.pages.dev",
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-alias-url",
				"https://alias.example.com",
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"pages-deployment-alias-url",
				"https://alias.example.com",
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"pages-deployment-id",
				"abc-123",
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"pages-environment",
				"production",
			);
		});
	});

	describe("with deploy output entry", () => {
		it("Sets deployment-url from deploy artifact with targets", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.88.0", "command_line_args":["deploy"], "log_file_path": "/here"}
{"version": 1, "type":"deploy", "targets": ["https://worker.example.com"]}`,
				},
			});

			await handleCommandOutputParsing(testConfig, "deploy", "some stdout");

			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://worker.example.com",
			);
		});

		it("Uses first URL when multiple targets exist", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");
			const infoSpy = vi.spyOn(core, "info");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.88.0", "command_line_args":["deploy"], "log_file_path": "/here"}
{"version": 1, "type":"deploy", "targets": ["https://first.example.com", "https://second.example.com"]}`,
				},
			});

			await handleCommandOutputParsing(testConfig, "deploy", "some stdout");

			expect(infoSpy).toHaveBeenCalledWith(
				"Multiple deployment urls found in wrangler deploy output file, deployment-url will be set to the first url",
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://first.example.com",
			);
		});

		it("Logs info when targets array is empty", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");
			const infoSpy = vi.spyOn(core, "info");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.88.0", "command_line_args":["deploy"], "log_file_path": "/here"}
{"version": 1, "type":"deploy", "targets": []}`,
				},
			});

			await handleCommandOutputParsing(testConfig, "deploy", "some stdout");

			expect(infoSpy).toHaveBeenCalledWith(
				"No deployment-url found in wrangler deploy output file",
			);
			expect(setOutputSpy).not.toHaveBeenCalledWith(
				"deployment-url",
				expect.anything(),
			);
		});
	});

	describe("with version-upload output entry", () => {
		it("Sets deployment-url from version upload preview_url", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.88.0", "command_line_args":["versions","upload"], "log_file_path": "/here"}
{"version": 1, "type":"version-upload", "preview_url": "https://preview.example.com"}`,
				},
			});

			await handleCommandOutputParsing(
				testConfig,
				"versions upload",
				"some stdout",
			);

			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://preview.example.com",
			);
		});
	});

	describe("deprecated stdout parsing fallback", () => {
		it("Falls back to stdout parsing for pages deploy when no artifact exists", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");
			const infoSpy = vi.spyOn(core, "info");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			const stdOut =
				"Deploying to https://my-project.pages.dev\nalias URL: https://abc123.my-project.pages.dev";

			await handleCommandOutputParsing(
				testConfig,
				"pages deploy ./dist",
				stdOut,
			);

			expect(infoSpy).toHaveBeenCalledWith(
				expect.stringContaining("Unable to find a WRANGLER_OUTPUT_DIR"),
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://my-project.pages.dev",
			);
			expect(setOutputSpy).toHaveBeenCalledWith(
				"pages-deployment-alias-url",
				"https://abc123.my-project.pages.dev",
			);
		});

		it("Falls back to stdout parsing for pages publish", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			await handleCommandOutputParsing(
				testConfig,
				"pages publish ./dist",
				"Deploying to https://my-project.pages.dev",
			);

			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://my-project.pages.dev",
			);
		});

		it("Falls back to stdout parsing for deploy command", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			await handleCommandOutputParsing(
				testConfig,
				"deploy",
				"Published to https://worker.example.com",
			);

			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://worker.example.com",
			);
		});

		it("Falls back to stdout parsing for publish command", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			await handleCommandOutputParsing(
				testConfig,
				"publish",
				"Published to https://worker.example.com",
			);

			expect(setOutputSpy).toHaveBeenCalledWith(
				"deployment-url",
				"https://worker.example.com",
			);
		});

		it("Logs info for versions upload when no artifact exists", async () => {
			const testConfig = getTestConfig();
			const infoSpy = vi.spyOn(core, "info");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			await handleCommandOutputParsing(
				testConfig,
				"versions upload",
				"some stdout",
			);

			expect(infoSpy).toHaveBeenCalledWith(
				expect.stringContaining("Unable to find a WRANGLER_OUTPUT_DIR"),
			);
		});

		it("Does nothing for unrecognized commands when no artifact exists", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			await handleCommandOutputParsing(
				testConfig,
				"tail --format json",
				"some stdout",
			);

			expect(setOutputSpy).not.toHaveBeenCalled();
		});

		it("Handles stdout with no URL match gracefully", async () => {
			const testConfig = getTestConfig();
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {},
			});

			await handleCommandOutputParsing(
				testConfig,
				"pages deploy ./dist",
				"No URLs here",
			);

			expect(setOutputSpy).toHaveBeenCalledWith("deployment-url", "");
			expect(setOutputSpy).toHaveBeenCalledWith(
				"pages-deployment-alias-url",
				"",
			);
		});
	});
});
