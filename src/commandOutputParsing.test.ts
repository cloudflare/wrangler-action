import * as core from "@actions/core";
import mockfs from "mock-fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCommandOutputParsing } from "./commandOutputParsing";
import { getTestConfig } from "./test/test-utils";

afterEach(() => {
	mockfs.restore();
	vi.restoreAllMocks();
});

describe("handleCommandOutputParsing", () => {
	it("sets Workers Preview outputs from the artifact", async () => {
		mockfs({
			testOutputDir: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
        {"version": 1, "type":"preview", "worker_name":"example-worker", "preview_id":"preview-id", "preview_name":"feature-branch", "preview_slug":"feature-branch", "preview_urls":["https://feature-branch.example-worker.workers.dev"], "deployment_id":"deployment-id", "deployment_urls":["https://deployment-id.example-worker.workers.dev"]}`,
			},
		});
		const setOutput = vi
			.spyOn(core, "setOutput")
			.mockImplementation(() => undefined);
		const config = getTestConfig({
			config: {
				WRANGLER_OUTPUT_DIR: "./testOutputDir",
				GITHUB_TOKEN: "",
			},
		});

		await handleCommandOutputParsing(config, "preview", "");

		expect(setOutput).toHaveBeenCalledWith(
			"deployment-url",
			"https://feature-branch.example-worker.workers.dev",
		);
		expect(setOutput).toHaveBeenCalledWith(
			"preview-url",
			"https://feature-branch.example-worker.workers.dev",
		);
		expect(setOutput).toHaveBeenCalledWith(
			"preview-deployment-url",
			"https://deployment-id.example-worker.workers.dev",
		);
		expect(setOutput).toHaveBeenCalledWith("preview-name", "feature-branch");
		expect(setOutput).toHaveBeenCalledWith("preview-id", "preview-id");
		expect(setOutput).toHaveBeenCalledWith(
			"preview-deployment-id",
			"deployment-id",
		);
	});

	it("falls back to deployment-url stdout parsing for preview commands", async () => {
		mockfs({});
		const setOutput = vi
			.spyOn(core, "setOutput")
			.mockImplementation(() => undefined);
		const config = getTestConfig({
			config: {
				WRANGLER_OUTPUT_DIR: "./missing-output-dir",
				GITHUB_TOKEN: "",
			},
		});

		await handleCommandOutputParsing(
			config,
			"preview --name feature-branch",
			"Preview URL: https://feature-branch.example-worker.workers.dev",
		);

		expect(setOutput).toHaveBeenCalledOnce();
		expect(setOutput).toHaveBeenCalledWith(
			"deployment-url",
			"https://feature-branch.example-worker.workers.dev",
		);
	});

	it.each([
		"preview delete --name feature-branch --skip-confirmation",
		"preview secret list --name feature-branch",
		"preview base-config secret list",
		"preview future-command",
	])("does not use deployment fallback for `%s`", async (command) => {
		mockfs({});
		const setOutput = vi
			.spyOn(core, "setOutput")
			.mockImplementation(() => undefined);
		const config = getTestConfig({
			config: {
				WRANGLER_OUTPUT_DIR: "./missing-output-dir",
				GITHUB_TOKEN: "",
			},
		});

		await handleCommandOutputParsing(config, command, "");

		expect(setOutput).not.toHaveBeenCalled();
	});
});
