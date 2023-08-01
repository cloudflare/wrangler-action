import { expect, test, describe } from "vitest";
import { checkWorkingDirectory, getNpxCmd, semverCompare } from "./index";
import path from "node:path";

const config = {
	WRANGLER_VERSION: "mockVersion",
	secrets: ["mockSercret", "mockSecretAgain"],
	workingDirectory: "./mockWorkingDirectory",
	CLOUDFLARE_API_TOKEN: "mockAPIToken",
	CLOUDFLARE_ACCOUNT_ID: "mockAccountID",
	ENVIRONMENT: undefined,
	VARS: ["mockVar", "mockVarAgain"],
	COMMANDS: ["mockCommand", "mockCommandAgain"],
};

test("getNpxCmd ", async () => {
	process.env.RUNNER_OS = "Windows";
	expect(getNpxCmd()).toBe("npx.cmd");

	process.env.RUNNER_OS = "Mac";
	expect(getNpxCmd()).toBe("npx");

	process.env.RUNNER_OS = "Linux";
	expect(getNpxCmd()).toBe("npx");

	delete process.env.RUNNER_OS;
});

describe("semverCompare", () => {
	test("should return false if the second argument is equal to the first argument", () => {
		const isVersion1LessThanVersion2 = semverCompare("1.2.3", "1.2.3");

		expect(isVersion1LessThanVersion2).toBe(false);
	});

	test("should return true if the first argument is less than the second argument", () => {
		const isVersion1LessThanVersion2 = semverCompare("1.2.2", "1.2.3");

		expect(isVersion1LessThanVersion2).toBe(true);
	});
});

describe("checkWorkingDirectory", () => {
	test("should return the normalized path if the directory exists", () => {
		const normalizedPath = checkWorkingDirectory(".");
		expect(normalizedPath).toBe(path.normalize("."));
	});

	test("should fail if the directory does not exist", () => {
		try {
			checkWorkingDirectory("/does/not/exist");
		} catch (error) {
			expect(error.message).toMatchInlineSnapshot();
		}
	});

	test("should fail if an error occurs while checking/creating the directory", () => {
		try {
			checkWorkingDirectory("/does/not/exist");
		} catch (error) {
			expect(error.message).toMatchInlineSnapshot();
		}
	});
});
