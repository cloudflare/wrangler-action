import { existsSync } from "node:fs";
import * as path from "node:path";
import semverGt from "semver/functions/gt";

/**
 * A helper function to compare two semver versions. If the second arg is greater than the first arg, it returns true.
 */
export function semverCompare(version1: string, version2: string) {
	if (version2 === "latest") return true;

	return semverGt(version2, version1);
}

export function checkWorkingDirectory(workingDirectory = ".") {
	const normalizedPath = path.normalize(workingDirectory);
	if (existsSync(normalizedPath)) {
		return normalizedPath;
	} else {
		throw new Error(`Directory ${workingDirectory} does not exist.`);
	}
}
