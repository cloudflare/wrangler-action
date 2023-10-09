import path from "node:path";
import { describe, expect, test } from "vitest";
import { checkWorkingDirectory, semverCompare } from "./utils";

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
