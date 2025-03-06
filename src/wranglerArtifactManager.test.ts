import mockfs from "mock-fs";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
	getOutputEntry,
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

	describe("getOutputEntry()", async () => {
		describe("OutputEntryPagesDeployment", async () => {
			it("Returns only detailed pages deploy output from wrangler artifacts", async () => {
				mockfs({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
						{"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["what's up"], "log_file_path": "/here"}
						{"version": 1, "type":"pages-deploy-detailed", "pages_project": "project", "environment":"production", "alias":"test.com", "deployment_id": "123", "url":"url.com"}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifact = await getOutputEntry("./testOutputDir");
				if (artifact?.type !== "pages-deploy-detailed") {
					throw new Error(`Unexpected type ${artifact?.type}`);
				}

				expect(artifact).toEqual({
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

					const artifact = await getOutputEntry("./testOutputDir");
					if (artifact?.type !== "pages-deploy-detailed") {
						throw new Error(`Unexpected type ${artifact?.type}`);
					}

					expect(artifact).toEqual({
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

		describe("OutputEntryDeployment", async () => {
			it("Returns only wrangler deploy output from wrangler artifacts", async () => {
				mockfs({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
						{"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["what's up"], "log_file_path": "/here"}
						{"version": 1, "type":"deploy", "targets": ["https://example.com"]}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifact = await getOutputEntry("./testOutputDir");
				if (artifact?.type !== "deploy") {
					throw new Error(`Unexpected type ${artifact?.type}`);
				}

				expect(artifact).toEqual({
					version: 1,
					type: "deploy",
					targets: ["https://example.com"],
				});
			}),
				it("Skips artifact entries that are not parseable", async () => {
					mockfs({
						testOutputDir: {
							"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
						this line is invalid json.
						{"version": 1, "type":"deploy", "targets": ["https://example.com"]}`,
							"not-wrangler-output.json": "test",
						},
					});

					const artifact = await getOutputEntry("./testOutputDir");
					if (artifact?.type !== "deploy") {
						throw new Error(`Unexpected type ${artifact?.type}`);
					}

					expect(artifact).toEqual({
						version: 1,
						type: "deploy",
						targets: ["https://example.com"],
					});
				});
		});

		describe("OutputEntryVersionUpload", async () => {
			it("Returns only version upload output from wrangler artifacts", async () => {
				const version_id = randomUUID();

				mockfs({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
						{"version": 1, "type":"wrangler-session", "wrangler_version":"3.81.0", "command_line_args":["what's up"], "log_file_path": "/here"}
						{"version": 1, "type":"version-upload", "version_id":"${version_id}", "preview_url": "https://example.com"}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifact = await getOutputEntry("./testOutputDir");
				if (artifact?.type !== "version-upload") {
					throw new Error(`Unexpected type ${artifact?.type}`);
				}

				expect(artifact).toEqual({
					version: 1,
					type: "version-upload",
					version_id,
					preview_url: "https://example.com",
				});
			});

			it("Skips artifact entries that are not parseable", async () => {
				const version_id = randomUUID();

				mockfs({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
						this line is invalid json.
						{"version": 1, "type":"version-upload", "version_id":"${version_id}", "preview_url": "https://example.com"}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifact = await getOutputEntry("./testOutputDir");
				if (artifact?.type !== "version-upload") {
					throw new Error(`Unexpected type ${artifact?.type}`);
				}

				expect(artifact).toEqual({
					version: 1,
					type: "version-upload",
					version_id,
					preview_url: "https://example.com",
				});
			});

			it("Skips uploads with invalid version ids", async () => {
				mockfs({
					testOutputDir: {
						"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": `
						this line is invalid json.
						{"version": 1, "type":"version-upload", "version_id":"invalid-value", "preview_url": "https://example.com"}`,
						"not-wrangler-output.json": "test",
					},
				});

				const artifact = await getOutputEntry("./testOutputDir");

				expect(artifact).toBeNull();
			});
		});
	});
});
