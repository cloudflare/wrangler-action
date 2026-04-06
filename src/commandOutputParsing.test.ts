import * as core from "@actions/core";
import mockfs from "mock-fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCommandOutputParsing } from "./commandOutputParsing";
import { getTestConfig } from "./test/test-utils";

vi.mock("./service/github", () => ({
	createGitHubDeploymentAndJobSummary: vi.fn(),
}));

const testConfig = getTestConfig();

afterEach(() => {
	mockfs.restore();
	vi.restoreAllMocks();
});

describe("handleCommandOutputParsing", () => {
	describe("version-upload", () => {
		it("Sets version-id output when version_id is present", async () => {
			const setOutputSpy = vi.spyOn(core, "setOutput");

			mockfs({
				[testConfig.WRANGLER_OUTPUT_DIR]: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
{"version": 1, "type":"wrangler-session", "wrangler_version":"3.88.0", "command_line_args":["versions","upload"], "log_file_path": "/here"}
{"version": 1, "type":"version-upload", "preview_url": "https://preview.example.com", "version_id": "ver-abc-123"}`,
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
			expect(setOutputSpy).toHaveBeenCalledWith(
				"version-id",
				"ver-abc-123",
			);
		});

		it("Handles version-upload when version_id is missing", async () => {
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
			expect(setOutputSpy).toHaveBeenCalledWith(
				"version-id",
				undefined,
			);
		});
	});
});
