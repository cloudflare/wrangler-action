import { describe, expect, it } from "vitest";
import {
	getDetailedPagesDeployOutput,
	getWranglerArtifacts,
} from "./wranglerArtifactManager";

describe("wranglerArtifactsManager", () => {
	const mock = require("mock-fs");

	describe("getWranglerArtifacts()", async () => {
		it("Returns only wrangler output files from a given directory", async () => {
			mock({
				testOutputDir: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
                    {"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["what's up"], "log_file_path": "/here"}
                    {"version": 1, "type":"pages-deploy-detailed", "environment":"production", "alias":"test.com", "deployment_id": "123", "url":"url.com"}`,
					"not-wrangler-output.json": "test",
				},
			});

			const artifacts = await getWranglerArtifacts("./testOutputDir");

			expect(artifacts).toEqual([
				"./testOutputDir/wrangler-output-2024-10-17_18-48-40_463-2e6e83.json",
			]);
			mock.restore();
		});
	});

	describe("getDetailedPagesDeployOutput()", async () => {
		it("Returns only detailed pages deploy output from wrangler artifacts", async () => {
			mock({
				testOutputDir: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
                    {"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["what's up"], "log_file_path": "/here"}
                    {"version": 1, "type":"pages-deploy-detailed", "environment":"production", "alias":"test.com", "deployment_id": "123", "url":"url.com"}`,
					"not-wrangler-output.json": "test",
				},
			});

			const artifacts = await getDetailedPagesDeployOutput("./testOutputDir");

			expect(artifacts).toEqual({
				version: 1,
				type: "pages-deploy-detailed",
				url: "url.com",
				environment: "production",
				deployment_id: "123",
				alias: "test.com",
			});
			mock.restore();
		}),
			it("Skips artifact entries that are not parseable", async () => {
				mock({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
                    this line is invalid json.
                    {"version": 1, "type":"pages-deploy-detailed", "environment":"production", "alias":"test.com", "deployment_id": "123", "url":"url.com"}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifacts = await getDetailedPagesDeployOutput("./testOutputDir");

				expect(artifacts).toEqual({
					version: 1,
					type: "pages-deploy-detailed",
					url: "url.com",
					environment: "production",
					deployment_id: "123",
					alias: "test.com",
				});
				mock.restore();
			});
	});
});
