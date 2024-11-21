import { existsSync } from "node:fs";
import * as path from "node:path";
import semverGt from "semver/functions/gt";
import { info as originalInfo, error as originalError } from "@actions/core";
import { WranglerActionConfig } from "./wranglerAction";

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

export function info(
	config: WranglerActionConfig,
	message: string,
	bypass?: boolean,
): void {
	if (!config.QUIET_MODE || bypass) {
		originalInfo(message);
	}
}

export function error(
	config: WranglerActionConfig,
	message: string,
	bypass?: boolean,
): void {
	if (!config.QUIET_MODE || bypass) {
		originalError(message);
	}
}
