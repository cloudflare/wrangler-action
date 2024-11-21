import mockfs from "mock-fs";
import { afterEach, describe, expect, it } from "vitest";
import {
	getDetailedPagesDeployOutput,
	getWranglerArtifacts,
} from "./wranglerArtifactManager";

afterEach(() => {
	mockfs.restore();
});
describe("wranglerArtifactsManager", () => {
	describe("getWranglerArtifacts()", async () => {
		it("Returns only wrangler output files from a given directory", async () => {
			mockfs({
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
		});
		it("Returns an empty list when the output directory doesn't exist", async () => {
			mockfs({
				notTheDirWeWant: {},
			});

			const artifacts = await getWranglerArtifacts("./testOutputDir");
			expect(artifacts).toEqual([]);
		});
	});

	describe("getDetailedPagesDeployOutput()", async () => {
		it("Returns only detailed pages deploy output from wrangler artifacts", async () => {
			mockfs({
				testOutputDir: {
					"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
                    {"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["what's up"], "log_file_path": "/here"}
                    {"version": 1, "type":"pages-deploy-detailed", "pages_project": "project", "environment":"production", "alias":"test.com", "deployment_id": "123", "url":"url.com"}`,
					"not-wrangler-output.json": "test",
				},
			});

			const artifacts = await getDetailedPagesDeployOutput("./testOutputDir");

			expect(artifacts).toEqual({
				version: 1,
				pages_project: "project",
				type: "pages-deploy-detailed",
				url: "url.com",
				environment: "production",
				deployment_id: "123",
				alias: "test.com",
			});
		}),
			it("Skips artifact entries that are not parseable", async () => {
				mockfs({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
                    this line is invalid json.
                    {"version": 1, "type":"pages-deploy-detailed", "pages_project": "project", "environment":"production", "alias":"test.com", "deployment_id": "123", "url":"url.com"}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifacts = await getDetailedPagesDeployOutput("./testOutputDir");

				expect(artifacts).toEqual({
					version: 1,
					type: "pages-deploy-detailed",
					pages_project: "project",
					url: "url.com",
					environment: "production",
					deployment_id: "123",
					alias: "test.com",
				});
			});
	});
});
