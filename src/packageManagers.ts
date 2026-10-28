import { getExecOutput } from "@actions/exec";
import { existsSync } from "node:fs";
import * as path from "node:path";
import semverGte from "semver/functions/gte";
import semverValid from "semver/functions/valid";

export interface PackageManager {
	install: string;
	exec: string;
	execNoInstall: string;
}

const PACKAGE_MANAGERS = {
	npm: {
		install: "npm i",
		exec: "npx",
		execNoInstall: "npx --no-install",
	},
	yarn: {
		install: "yarn add",
		exec: "yarn",
		execNoInstall: "yarn",
	},
	pnpm: {
		install: "pnpm add",
		exec: "pnpm exec",
		execNoInstall: "pnpm exec",
	},
	bun: {
		install: "bun i",
		exec: "bunx",
		execNoInstall: "bun run",
	},
} as const satisfies Readonly<Record<string, PackageManager>>;

type PackageManagerValue = keyof typeof PACKAGE_MANAGERS;

function detectPackageManager(
	workingDirectory = ".",
): PackageManagerValue | null {
	if (existsSync(path.join(workingDirectory, "package-lock.json"))) {
		return "npm";
	}
	if (existsSync(path.join(workingDirectory, "yarn.lock"))) {
		return "yarn";
	}
	if (existsSync(path.join(workingDirectory, "pnpm-lock.yaml"))) {
		return "pnpm";
	}
	if (
		existsSync(path.join(workingDirectory, "bun.lockb")) ||
		existsSync(path.join(workingDirectory, "bun.lock"))
	) {
		return "bun";
	}
	return null;
}

function assertValidPackageManagerValue(
	name: string,
): asserts name is PackageManagerValue | "" {
	if (name && !Object.keys(PACKAGE_MANAGERS).includes(name)) {
		throw new TypeError(
			`invalid value provided for "packageManager": ${name}
	Value must be one of: [${Object.keys(PACKAGE_MANAGERS).join(", ")}]`,
		);
	}
}

export function getPackageManager(
	name: string,
	{ workingDirectory = "." }: { workingDirectory?: string } = {},
) {
	assertValidPackageManagerValue(name);

	return PACKAGE_MANAGERS[
		name || detectPackageManager(workingDirectory) || "npm"
	];
}

// Wrangler's dependencies with install scripts. pnpm 11 and later fail an install that leaves any
// build script unapproved (ERR_PNPM_IGNORED_BUILDS), so installing Wrangler has to approve them.
const WRANGLER_BUILD_DEPENDENCIES = ["esbuild", "workerd", "sharp"];

export async function getInstallArgs(
	packageManager: PackageManager,
	{ workingDirectory = "." }: { workingDirectory?: string } = {},
): Promise<string[]> {
	if (packageManager !== PACKAGE_MANAGERS.pnpm) {
		return [];
	}

	// Earlier versions only warn about unapproved build scripts, and those before 10.4.0 reject
	// --allow-build, so leave their install as it was.
	const { stdout } = await getExecOutput("pnpm", ["--version"], {
		cwd: workingDirectory,
		silent: true,
		ignoreReturnCode: true,
	});
	const version = semverValid(stdout.trim());
	if (!version || !semverGte(version, "11.0.0")) {
		return [];
	}

	return WRANGLER_BUILD_DEPENDENCIES.map((name) => `--allow-build=${name}`);
}
