import { expect, test, describe } from "vitest";
import { checkWorkingDirectory, getNpxCmd, semverCompare } from "./utils";
import path from "node:path";

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
		expect(() =>
			checkWorkingDirectory("/does/not/exist"),
		).toThrowErrorMatchingInlineSnapshot(
			'"Directory /does/not/exist does not exist."',
		);
	});
});
