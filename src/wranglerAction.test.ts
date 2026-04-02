import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	authenticationSetup,
	execCommands,
	installWrangler,
	uploadSecrets,
	wranglerCommands,
} from "./wranglerAction";
import { getTestConfig } from "./test/test-utils";

vi.mock("./commandOutputParsing", () => ({
	handleCommandOutputParsing: vi.fn(),
}));

afterEach(() => {
	vi.restoreAllMocks();
	delete process.env.CLOUDFLARE_API_TOKEN;
	delete process.env.CLOUDFLARE_ACCOUNT_ID;
	delete process.env.WRANGLER_OUTPUT_FILE_DIRECTORY;
});

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

describe("uploadSecrets", () => {
	const testPackageManager = {
		install: "npm i",
		exec: "npx",
		execNoInstall: "npx --no-install",
	};

	it("WRANGLER_VERSION < 3.4.0 uses wrangler secret put", async () => {
		vi.stubEnv("FAKE_SECRET", "FAKE_VALUE");
		const testConfig = getTestConfig({
			config: {
				WRANGLER_VERSION: "3.3.0",
				didUserProvideWranglerVersion: true,
				secrets: ["FAKE_SECRET"],
			},
		});
		vi.spyOn(exec, "exec").mockImplementation(async (cmd, args) => {
			expect(cmd).toBe("npx");
			expect(args).toStrictEqual([
				"wrangler",
				"secret",
				"put",
				"FAKE_SECRET",
				"--env",
				"dev",
			]);
			return 0;
		});
		const startGroup = vi.spyOn(core, "startGroup");
		const endGroup = vi.spyOn(core, "endGroup");

		await uploadSecrets(testConfig, testPackageManager);
		expect(startGroup).toBeCalledWith("🔑 Uploading secrets...");
		expect(endGroup).toHaveBeenCalledOnce();
	});

	it("WRANGLER_VERSION < 3.60.0 uses wrangler secret:bulk", async () => {
		vi.stubEnv("FAKE_SECRET", "FAKE_VALUE");
		const testConfig = getTestConfig({
			config: {
				WRANGLER_VERSION: "3.59.0",
				didUserProvideWranglerVersion: true,
				secrets: ["FAKE_SECRET"],
			},
		});
		vi.spyOn(exec, "exec").mockImplementation(async (cmd, args) => {
			expect(cmd).toBe("npx");
			expect(args).toStrictEqual(["wrangler", "secret:bulk", "--env", "dev"]);
			return 0;
		});
		const startGroup = vi.spyOn(core, "startGroup");
		const endGroup = vi.spyOn(core, "endGroup");

		await uploadSecrets(testConfig, testPackageManager);
		expect(startGroup).toBeCalledWith("🔑 Uploading secrets...");
		expect(endGroup).toHaveBeenCalledOnce();
	});

	it("WRANGLER_VERSION 3.61.0 uses wrangler secret bulk", async () => {
		vi.stubEnv("FAKE_SECRET", "FAKE_VALUE");
		const testConfig = getTestConfig({
			config: {
				WRANGLER_VERSION: "3.61.0",
				didUserProvideWranglerVersion: true,
				secrets: ["FAKE_SECRET"],
			},
		});
		vi.spyOn(exec, "exec").mockImplementation(async (cmd, args) => {
			expect(cmd).toBe("npx");
			expect(args).toStrictEqual([
				"wrangler",
				"secret",
				"bulk",
				"--env",
				"dev",
			]);
			return 0;
		});
		const startGroup = vi.spyOn(core, "startGroup");
		const endGroup = vi.spyOn(core, "endGroup");

		await uploadSecrets(testConfig, testPackageManager);
		expect(startGroup).toBeCalledWith("🔑 Uploading secrets...");
		expect(endGroup).toHaveBeenCalledOnce();
	});

	it("Skips upload when secrets array is empty", async () => {
		const testConfig = getTestConfig({
			config: { secrets: [] },
		});
		const execSpy = vi.spyOn(exec, "exec");
		await uploadSecrets(testConfig, testPackageManager);
		expect(execSpy).not.toHaveBeenCalled();
	});

	it("Throws when secret value is not in environment", async () => {
		const testConfig = getTestConfig({
			config: {
				WRANGLER_VERSION: "3.61.0",
				secrets: ["MISSING_SECRET"],
			},
		});
		vi.spyOn(exec, "exec").mockImplementation(async () => 0);
		await expect(
			uploadSecrets(testConfig, testPackageManager),
		).rejects.toThrowError("Failed to upload secrets.");
	});
});

describe("authenticationSetup", () => {
	it("Sets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars", () => {
		const testConfig = getTestConfig({
			config: {
				CLOUDFLARE_API_TOKEN: "test-api-token",
				CLOUDFLARE_ACCOUNT_ID: "test-account-id",
			},
		});

		authenticationSetup(testConfig);

		expect(process.env.CLOUDFLARE_API_TOKEN).toBe("test-api-token");
		expect(process.env.CLOUDFLARE_ACCOUNT_ID).toBe("test-account-id");
	});
});

describe("execCommands", () => {
	const testPackageManager = {
		install: "npm i",
		exec: "npx",
		execNoInstall: "npx --no-install",
	};

	it("Does nothing when commands array is empty", async () => {
		const testConfig = getTestConfig();
		const startGroupSpy = vi.spyOn(core, "startGroup");
		await execCommands(testConfig, testPackageManager, [], "pre");
		expect(startGroupSpy).not.toHaveBeenCalled();
	});

	it("Prefixes wrangler commands with package manager exec", async () => {
		const testConfig = getTestConfig();
		const { execShell } = await import("./exec");
		const execShellMock = vi.fn().mockResolvedValue(0);
		vi.spyOn(await import("./exec"), "execShell").mockImplementation(
			execShellMock,
		);

		await execCommands(
			testConfig,
			testPackageManager,
			["wrangler dev"],
			"pre",
		);

		expect(execShellMock).toHaveBeenCalledWith("npx wrangler dev", {
			cwd: testConfig.workingDirectory,
			silent: false,
		});
	});

	it("Runs non-wrangler commands as-is", async () => {
		const testConfig = getTestConfig();
		const execShellMock = vi.fn().mockResolvedValue(0);
		vi.spyOn(await import("./exec"), "execShell").mockImplementation(
			execShellMock,
		);

		await execCommands(testConfig, testPackageManager, ["echo hello"], "post");

		expect(execShellMock).toHaveBeenCalledWith("echo hello", {
			cwd: testConfig.workingDirectory,
			silent: false,
		});
	});

	it("Runs multiple commands sequentially", async () => {
		const testConfig = getTestConfig();
		const callOrder: string[] = [];
		vi.spyOn(await import("./exec"), "execShell").mockImplementation(
			async (cmd) => {
				callOrder.push(cmd as string);
				return 0;
			},
		);

		await execCommands(
			testConfig,
			testPackageManager,
			["echo first", "echo second"],
			"pre",
		);

		expect(callOrder).toEqual(["echo first", "echo second"]);
	});
});

describe("wranglerCommands", () => {
	const testPackageManager = {
		install: "npm i",
		exec: "npx",
		execNoInstall: "npx --no-install",
	};

	it("Defaults to deploy command when no commands specified", async () => {
		const testConfig = getTestConfig({
			config: {
				COMMANDS: [],
				WRANGLER_VERSION: "3.81.0",
				ENVIRONMENT: "",
				VARS: [],
			},
		});
		const execSpy = vi
			.spyOn(exec, "exec")
			.mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(execSpy).toHaveBeenCalledWith(
			"npx wrangler deploy",
			[],
			expect.anything(),
		);
	});

	it("Uses publish for wrangler versions before 2.20.0", async () => {
		const testConfig = getTestConfig({
			config: {
				COMMANDS: [],
				WRANGLER_VERSION: "2.19.0",
				ENVIRONMENT: "",
				VARS: [],
			},
		});
		const execSpy = vi
			.spyOn(exec, "exec")
			.mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(execSpy).toHaveBeenCalledWith(
			"npx wrangler publish",
			[],
			expect.anything(),
		);
	});

	it("Appends --env flag when environment is set and not already in command", async () => {
		const testConfig = getTestConfig({
			config: {
				COMMANDS: ["deploy"],
				ENVIRONMENT: "staging",
				VARS: [],
			},
		});
		const execSpy = vi
			.spyOn(exec, "exec")
			.mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(execSpy).toHaveBeenCalledWith(
			"npx wrangler deploy",
			["--env", "staging"],
			expect.anything(),
		);
	});

	it("Does not duplicate --env flag when already in command", async () => {
		const testConfig = getTestConfig({
			config: {
				COMMANDS: ["deploy --env production"],
				ENVIRONMENT: "staging",
				VARS: [],
			},
		});
		const execSpy = vi
			.spyOn(exec, "exec")
			.mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(execSpy).toHaveBeenCalledWith(
			"npx wrangler deploy --env production",
			[],
			expect.anything(),
		);
	});

	it("Appends --var flags for deploy commands with VARS", async () => {
		vi.stubEnv("MY_VAR", "my_value");
		const testConfig = getTestConfig({
			config: {
				COMMANDS: ["deploy"],
				ENVIRONMENT: "",
				VARS: ["MY_VAR"],
			},
		});
		const execSpy = vi
			.spyOn(exec, "exec")
			.mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(execSpy).toHaveBeenCalledWith(
			"npx wrangler deploy",
			["--var", "MY_VAR:my_value"],
			expect.anything(),
		);
	});

	it("Does not append --var for non-deploy commands", async () => {
		vi.stubEnv("MY_VAR", "my_value");
		const testConfig = getTestConfig({
			config: {
				COMMANDS: ["tail --format json"],
				ENVIRONMENT: "",
				VARS: ["MY_VAR"],
			},
		});
		const execSpy = vi
			.spyOn(exec, "exec")
			.mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(execSpy).toHaveBeenCalledWith(
			"npx wrangler tail --format json",
			[],
			expect.anything(),
		);
	});

	it("Sets command-output and command-stderr outputs", async () => {
		const testConfig = getTestConfig({
			config: {
				COMMANDS: ["deploy"],
				ENVIRONMENT: "",
				VARS: [],
			},
		});
		vi.spyOn(exec, "exec").mockImplementation(
			async (_cmd, _args, options) => {
				options?.listeners?.stdout?.(Buffer.from("deploy output"));
				options?.listeners?.stderr?.(Buffer.from("deploy warning"));
				return 0;
			},
		);
		const setOutputSpy = vi.spyOn(core, "setOutput");

		await wranglerCommands(testConfig, testPackageManager);

		expect(setOutputSpy).toHaveBeenCalledWith(
			"command-output",
			"deploy output",
		);
		expect(setOutputSpy).toHaveBeenCalledWith(
			"command-stderr",
			"deploy warning",
		);
	});

	it("Sets WRANGLER_OUTPUT_FILE_DIRECTORY env var", async () => {
		const testConfig = getTestConfig({
			config: {
				COMMANDS: ["deploy"],
				ENVIRONMENT: "",
				VARS: [],
				WRANGLER_OUTPUT_DIR: "/custom/output/dir",
			},
		});
		vi.spyOn(exec, "exec").mockImplementation(async () => 0);

		await wranglerCommands(testConfig, testPackageManager);

		expect(process.env.WRANGLER_OUTPUT_FILE_DIRECTORY).toBe(
			"/custom/output/dir",
		);
	});
});
