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
			`[Error: Directory /does/not/exist does not exist.]`,
		);
	});
});

describe("semverCompare", () => {
	test.each([
		["1.2.3", "1.2.3", false],
		["1.2.2", "1.2.3", true],
		["2.0.0", "3.0.0", true],
		["3.1.0", "3.1.1", true],
		["3.1.0", "3.5.0", true],
		["3.1.0", "3.10.0", true],
		["3.1.0", "3.15.0", true],
		["3.10.0", "3.1.0", false],
		["3.20.0", "3.2.0", false],
		["3.1.0", "latest", true],
		["4.0.0", "latest", true],
	])(
		"should semver compare %s vs %s correctly, expecting %s",
		(version1, version2, expected) => {
			const isVersion1LessThanVersion2 = semverCompare(version1, version2);

			expect(isVersion1LessThanVersion2).toBe(expected);
		},
	);
});
