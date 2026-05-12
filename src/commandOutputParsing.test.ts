import * as core from "@actions/core";
import mockfs from "mock-fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCommandOutputParsing, sanitizeUrl } from "./commandOutputParsing";
import { getTestConfig } from "./test/test-utils";

vi.mock("./service/github", () => ({
	createGitHubDeploymentAndJobSummary: vi.fn(),
}));

const testConfig = getTestConfig();

afterEach(() => {
	mockfs.restore();
	vi.restoreAllMocks();
});

describe("sanitizeUrl", () => {
	it("Returns URL unchanged when it already has https://", () => {
		expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
	});

	it("Strips text after whitespace", () => {
		expect(sanitizeUrl("https://example.com (custom domain)")).toBe(
			"https://example.com",
		);
	});

	it("Prepends https:// when no protocol is present", () => {
		expect(sanitizeUrl("example.com")).toBe("https://example.com");
	});

	it("Preserves http:// URLs without double-prefixing", () => {
		expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
	});

	it("Handles URL with both no protocol and trailing text", () => {
		expect(sanitizeUrl("example.com (custom domain)")).toBe(
			"https://example.com",
		);
	});
});

describe("handleCommandOutputParsing sanitizeUrl integration", () => {
	it("Sanitizes pages deploy URL that has a trailing suffix", async () => {
		const setOutputSpy = vi.spyOn(core, "setOutput");

		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["pages","deploy"], "log_file_path": "/here"}
{"version": 1, "type":"pages-deploy-detailed", "pages_project": "my-project", "environment":"production", "alias":"https://alias.example.com (custom domain)", "deployment_id": "abc-123", "url":"https://my-project.pages.dev (custom domain)"}`,
			},
		});

		await handleCommandOutputParsing(testConfig, "pages deploy", "");

		expect(setOutputSpy).toHaveBeenCalledWith(
			"deployment-url",
			"https://my-project.pages.dev",
		);
		expect(setOutputSpy).toHaveBeenCalledWith(
			"pages-deployment-alias-url",
			"https://alias.example.com",
		);
	});

	it("Prepends https:// to worker deploy target with no protocol", async () => {
		const setOutputSpy = vi.spyOn(core, "setOutput");

		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["deploy"], "log_file_path": "/here"}
{"version": 1, "type":"deploy", "targets": ["my-worker.example.com"]}`,
			},
		});

		await handleCommandOutputParsing(testConfig, "deploy", "");

		expect(setOutputSpy).toHaveBeenCalledWith(
			"deployment-url",
			"https://my-worker.example.com",
		);
	});
});
