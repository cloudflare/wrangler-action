import { existsSync } from "node:fs";
import * as path from "node:path";

interface PackageManager {
	install: string;
	exec: string;
}

const PACKAGE_MANAGERS = {
	npm: {
		install: "npm i",
		exec: "npx",
	},
	yarn: {
		install: "yarn add",
		exec: "yarn",
	},
	pnpm: {
		install: "pnpm add",
		exec: "pnpm exec",
	},
	"pnpm-workspace": {
		install: "pnpm add -w",
		exec: "pnpm exec",
	},
	bun: {
		install: "bun i",
		exec: "bunx",
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
		if (existsSync(path.join(workingDirectory, "pnpm-workspace.yaml"))) {
			// if this is a PNPM workspace, we must use the -w flag when installing wrangler or else it will error with ERR_PNPM_ADDING_TO_ROOT
			return "pnpm-workspace";
		}
		return "pnpm";
	}
	if (existsSync(path.join(workingDirectory, "bun.lockb"))) {
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
