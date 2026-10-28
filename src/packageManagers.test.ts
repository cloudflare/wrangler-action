import * as exec from "@actions/exec";
import { describe, expect, test, vi } from "vitest";
import { getInstallArgs, getPackageManager } from "./packageManagers";

describe("getPackageManager", () => {
	test("should use provided value instead of inferring from lockfile", () => {
		expect(
			getPackageManager("npm", { workingDirectory: "src/test/fixtures/npm" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "npx",
				  "execNoInstall": "npx --no-install",
				  "install": "npm i",
				}
			`);

		expect(
			getPackageManager("yarn", { workingDirectory: "src/test/fixtures/npm" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "yarn",
				  "execNoInstall": "yarn",
				  "install": "yarn add",
				}
			`);

		expect(
			getPackageManager("pnpm", { workingDirectory: "src/test/fixtures/npm" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "pnpm exec",
				  "execNoInstall": "pnpm exec",
				  "install": "pnpm add",
				}
			`);

		expect(
			getPackageManager("bun", { workingDirectory: "src/test/fixtures/bun" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "bunx",
				  "execNoInstall": "bun run",
				  "install": "bun i",
				}
			`);
	});

	test("should use npm if no value provided and package-lock.json exists", () => {
		expect(getPackageManager("", { workingDirectory: "src/test/fixtures/npm" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "npx",
				  "execNoInstall": "npx --no-install",
				  "install": "npm i",
				}
			`);
	});

	test("should use yarn if no value provided and yarn.lock exists", () => {
		expect(
			getPackageManager("", { workingDirectory: "src/test/fixtures/yarn" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "yarn",
				  "execNoInstall": "yarn",
				  "install": "yarn add",
				}
			`);
	});

	test("should use pnpm if no value provided and pnpm-lock.yaml exists", () => {
		expect(
			getPackageManager("", { workingDirectory: "src/test/fixtures/pnpm" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "pnpm exec",
				  "execNoInstall": "pnpm exec",
				  "install": "pnpm add",
				}
			`);
	});

	test("should use bun if no value provided and bun.lockb exists", () => {
		expect(getPackageManager("", { workingDirectory: "src/test/fixtures/bun" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "bunx",
				  "execNoInstall": "bun run",
				  "install": "bun i",
				}
			`);
	});

	test("should use npm if no value provided and no lockfile is present", () => {
		expect(
			getPackageManager("", { workingDirectory: "src/test/fixtures/empty" }),
		).toMatchInlineSnapshot(`
				{
				  "exec": "npx",
				  "execNoInstall": "npx --no-install",
				  "install": "npm i",
				}
			`);
	});

	test("should throw if an invalid value is provided", () => {
		expect(() =>
			getPackageManager("cargo", { workingDirectory: "src/test/fixtures/npm" }),
		).toThrowError();
	});
});

describe("getInstallArgs", () => {
	function mockPnpmVersion(version: string) {
		return vi.spyOn(exec, "getExecOutput").mockResolvedValue({
			exitCode: 0,
			stderr: "",
			stdout: `${version}\n`,
		});
	}

	test("should allow Wrangler's build scripts on pnpm 11 and later", async () => {
		for (const version of ["11.0.0", "12.5.1"]) {
			mockPnpmVersion(version);
			expect(await getInstallArgs(getPackageManager("pnpm"))).toEqual([
				"--allow-build=esbuild",
				"--allow-build=workerd",
				"--allow-build=sharp",
			]);
		}
	});

	test("should add nothing on pnpm before 11", async () => {
		for (const version of ["9.15.0", "10.33.0"]) {
			mockPnpmVersion(version);
			expect(await getInstallArgs(getPackageManager("pnpm"))).toEqual([]);
		}
	});

	test("should add nothing if the pnpm version cannot be read", async () => {
		mockPnpmVersion("");
		expect(await getInstallArgs(getPackageManager("pnpm"))).toEqual([]);
	});

	test("should not run pnpm for other package managers", async () => {
		const spy = mockPnpmVersion("12.5.1");
		spy.mockClear();
		for (const name of ["npm", "yarn", "bun"]) {
			expect(await getInstallArgs(getPackageManager(name))).toEqual([]);
		}
		expect(spy).not.toHaveBeenCalled();
	});
});
