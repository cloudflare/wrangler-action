import { describe, expect, test } from "vitest";
import { getPackageManager } from "./packageManagers";

describe("getPackageManager", () => {
	test("should use provided value instead of inferring from lockfile", () => {
		expect(getPackageManager("npm", { workingDirectory: "test/npm" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "npx",
				  "execNoInstall": "npx --no-install",
				  "install": "npm i",
				}
			`);

		expect(getPackageManager("yarn", { workingDirectory: "test/npm" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "yarn",
				  "execNoInstall": "yarn",
				  "install": "yarn add",
				}
			`);

		expect(getPackageManager("pnpm", { workingDirectory: "test/npm" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "pnpm exec",
				  "execNoInstall": "pnpm exec",
				  "install": "pnpm add",
				}
			`);

		expect(getPackageManager("bun", { workingDirectory: "test/bun" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "bunx",
				  "execNoInstall": "bun run",
				  "install": "bun i",
				}
			`);
	});

	test("should use npm if no value provided and package-lock.json exists", () => {
		expect(getPackageManager("", { workingDirectory: "test/npm" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "npx",
				  "execNoInstall": "npx --no-install",
				  "install": "npm i",
				}
			`);
	});

	test("should use yarn if no value provided and yarn.lock exists", () => {
		expect(getPackageManager("", { workingDirectory: "test/yarn" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "yarn",
				  "execNoInstall": "yarn",
				  "install": "yarn add",
				}
			`);
	});

	test("should use pnpm if no value provided and pnpm-lock.yaml exists", () => {
		expect(getPackageManager("", { workingDirectory: "test/pnpm" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "pnpm exec",
				  "execNoInstall": "pnpm exec",
				  "install": "pnpm add",
				}
			`);
	});

	test("should use bun if no value provided and bun.lockb exists", () => {
		expect(getPackageManager("", { workingDirectory: "test/bun" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "bunx",
				  "execNoInstall": "bun run",
				  "install": "bun i",
				}
			`);
	});

	test("should use npm if no value provided and no lockfile is present", () => {
		expect(getPackageManager("", { workingDirectory: "test/empty" }))
			.toMatchInlineSnapshot(`
				{
				  "exec": "npx",
				  "execNoInstall": "npx --no-install",
				  "install": "npm i",
				}
			`);
	});

	test("should throw if an invalid value is provided", () => {
		expect(() =>
			getPackageManager("cargo", { workingDirectory: "test/npm" }),
		).toThrowError();
	});
});
