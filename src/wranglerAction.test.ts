import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { describe, expect, it, vi } from "vitest";
import { installWrangler } from "./wranglerAction";
import { getTestConfig } from "./test/test-utils";

describe("installWrangler", () => {
	const testPackageManager = {
		install: "npm i",
		exec: "npx",
		execNoInstall: "npx --no-install",
	};

	it("Errors on unsupported wrangler version", async () => {
		const testConfig = getTestConfig({ config: { WRANGLER_VERSION: "1" } });
		await expect(
			installWrangler(testConfig, testPackageManager),
		).rejects.toThrowError(
			`Wrangler v1 is no longer supported by this action. Please use major version 2 or greater`,
		);
	});

	it("Does nothing if no wrangler version is specified and wrangler is already installed", async () => {
		const testConfig = getTestConfig();
		vi.spyOn(exec, "getExecOutput").mockImplementation(async () => {
			return {
				exitCode: 0,
				stderr: "",
				stdout: ` ⛅️ wrangler 3.48.0 (update available 3.53.1)`,
			};
		});
		const infoSpy = vi.spyOn(core, "info");
		await installWrangler(testConfig, testPackageManager);
		expect(infoSpy).toBeCalledWith(
			"✅ No wrangler version specified, using pre-installed wrangler version 3.48.0",
		);
	});

	it("Does nothing if the wrangler version specified is the same as the one installed", async () => {
		const testConfig = getTestConfig({
			config: {
				WRANGLER_VERSION: "3.48.0",
				didUserProvideWranglerVersion: true,
			},
		});
		vi.spyOn(exec, "getExecOutput").mockImplementation(async () => {
			return {
				exitCode: 0,
				stderr: "",
				stdout: ` ⛅️ wrangler 3.48.0 (update available 3.53.1)`,
			};
		});
		const infoSpy = vi.spyOn(core, "info");
		await installWrangler(testConfig, testPackageManager);
		expect(infoSpy).toBeCalledWith("✅ Using Wrangler 3.48.0");
	});
	it("Should install wrangler if the version specified is not already available", async () => {
		const testConfig = getTestConfig({
			config: {
				WRANGLER_VERSION: "3.48.0",
				didUserProvideWranglerVersion: true,
			},
		});
		vi.spyOn(exec, "getExecOutput").mockImplementation(async () => {
			return {
				exitCode: 0,
				stderr: "",
				stdout: ` ⛅️ wrangler 3.20.0 (update available 3.53.1)`,
			};
		});
		vi.spyOn(exec, "exec").mockImplementation(async () => {
			return 0;
		});
		const infoSpy = vi.spyOn(core, "info");
		await installWrangler(testConfig, testPackageManager);
		expect(infoSpy).toBeCalledWith("✅ Wrangler installed");
	});
});
