import { existsSync } from "node:fs";
import * as path from "node:path";

/**
 * A helper function to compare two semver versions. If the second arg is greater than the first arg, it returns true.
 */
export function semverCompare(version1: string, version2: string) {
	if (version2 === "latest") return true;

	const version1Parts = version1.split(".");
	const version2Parts = version2.split(".");

	for (const version1Part of version1Parts) {
		const version2Part = version2Parts.shift();

		if (version1Part !== version2Part && version2Part) {
			return version1Part < version2Part ? true : false;
		}
	}

	return false;
}

export function checkWorkingDirectory(workingDirectory = ".") {
	const normalizedPath = path.normalize(workingDirectory);
	if (existsSync(normalizedPath)) {
		return normalizedPath;
	} else {
		throw new Error(`Directory ${workingDirectory} does not exist.`);
	}
}

export type PackageManager = "npm" | "yarn" | "pnpm";

export function detectPackageManager(
	workingDirectory = ".",
): PackageManager | null {
	if (existsSync(path.join(workingDirectory, "package-lock.json"))) {
		return "npm";
	}
	if (existsSync(path.join(workingDirectory, "yarn.lock"))) {
		return "yarn";
	}
	if (existsSync(path.join(workingDirectory, "pnpm-lock.yaml"))) {
		return "pnpm";
	}
	return null;
}

export function isValidPackageManager(name: string): name is PackageManager {
	return name === "npm" || name === "yarn" || name === "pnpm";
}
