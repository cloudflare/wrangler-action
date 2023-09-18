import {
	getBooleanInput,
	getInput,
	getMultilineInput,
	endGroup as originalEndGroup,
	error as originalError,
	info as originalInfo,
	startGroup as originalStartGroup,
	setFailed,
} from "@actions/core";
import { exec, execSync } from "node:child_process";
import * as util from "node:util";
import {
	PackageManager,
	checkWorkingDirectory,
	detectPackageManager,
	isValidPackageManager,
	semverCompare,
} from "./utils";
const execAsync = util.promisify(exec);

const DEFAULT_WRANGLER_VERSION = "3.5.1";

interface PackageManagerCommands {
	install: string;
	exec: string;
}

const PACKAGE_MANAGER_COMMANDS = {
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
} as const satisfies Readonly<Record<PackageManager, PackageManagerCommands>>;

/**
 * A configuration object that contains all the inputs & immutable state for the action.
 */
const config = {
	WRANGLER_VERSION: getInput("wranglerVersion") || DEFAULT_WRANGLER_VERSION,
	secrets: getMultilineInput("secrets"),
	workingDirectory: checkWorkingDirectory(getInput("workingDirectory")),
	CLOUDFLARE_API_TOKEN: getInput("apiToken"),
	CLOUDFLARE_ACCOUNT_ID: getInput("accountId"),
	ENVIRONMENT: getInput("environment"),
	VARS: getMultilineInput("vars"),
	COMMANDS: getMultilineInput("command"),
	QUIET_MODE: getBooleanInput("quiet"),
	PACKAGE_MANAGER: getInput("packageManager"),
} as const;

function realPackageManager(): PackageManager {
	if (isValidPackageManager(config.PACKAGE_MANAGER)) {
		return config.PACKAGE_MANAGER;
	}

	const packageManager = detectPackageManager(config.workingDirectory);
	if (packageManager !== null) {
		return packageManager;
	}

	throw new Error("Package manager is not detected");
}

const pkgManagerCmd = PACKAGE_MANAGER_COMMANDS[realPackageManager()];

function info(message: string, bypass?: boolean): void {
	if (!config.QUIET_MODE || bypass) {
		originalInfo(message);
	}
}

function error(message: string, bypass?: boolean): void {
	if (!config.QUIET_MODE || bypass) {
		originalError(message);
	}
}

function startGroup(name: string): void {
	if (!config.QUIET_MODE) {
		originalStartGroup(name);
	}
}

function endGroup(): void {
	if (!config.QUIET_MODE) {
		originalEndGroup();
	}
}

async function main() {
	try {
		installWrangler();
		authenticationSetup();
		await execCommands(getMultilineInput("preCommands"), "pre");
		await uploadSecrets();
		await wranglerCommands();
		await execCommands(getMultilineInput("postCommands"), "post");
		info("🏁 Wrangler Action completed", true);
	} catch (err: unknown) {
		err instanceof Error && error(err.message);
		setFailed("🚨 Action failed");
	}
}

async function runProcess(
	command: Parameters<typeof execAsync>[0],
	options: Parameters<typeof execAsync>[1],
) {
	try {
		const result = await execAsync(command, options);

		result.stdout && info(result.stdout.toString());
		result.stderr && error(result.stderr.toString(), true);

		return result;
	} catch (err: any) {
		err.stdout && info(err.stdout.toString());
		err.stderr && error(err.stderr.toString(), true);
		throw new Error(`\`${command}\` returned non-zero exit code.`);
	}
}

function installWrangler() {
	if (config["WRANGLER_VERSION"].startsWith("1")) {
		throw new Error(
			`Wrangler v1 is no longer supported by this action. Please use major version 2 or greater`,
		);
	}
	startGroup("📥 Installing Wrangler");
	const command = `${pkgManagerCmd.install} wrangler@${config["WRANGLER_VERSION"]}`;
	info(`Running command: ${command}`);
	execSync(command, { cwd: config["workingDirectory"], env: process.env });
	info(`✅ Wrangler installed`, true);
	endGroup();
}

function authenticationSetup() {
	process.env.CLOUDFLARE_API_TOKEN = config["CLOUDFLARE_API_TOKEN"];
	process.env.CLOUDFLARE_ACCOUNT_ID = config["CLOUDFLARE_ACCOUNT_ID"];
}

async function execCommands(commands: string[], cmdType: string) {
	if (!commands.length) {
		return;
	}

	startGroup(`🚀 Running ${cmdType}Commands`);
	try {
		const arrPromises = commands.map(async (command) => {
			const cmd = command.startsWith("wrangler")
				? `${pkgManagerCmd.exec} ${command}`
				: command;

			info(`🚀 Executing command: ${cmd}`);

			return await runProcess(cmd, {
				cwd: config["workingDirectory"],
				env: process.env,
			});
		});

		await Promise.all(arrPromises);
	} finally {
		endGroup();
	}
}

/**
 * A helper function to get the secret from the environment variables.
 */
function getSecret(secret: string) {
	if (!secret) {
		throw new Error("Secret name cannot be blank.");
	}

	const value = process.env[secret];
	if (!value) {
		throw new Error(`Value for secret ${secret} not found.`);
	}

	return value;
}

async function legacyUploadSecrets(
	secrets: string[],
	environment?: string,
	workingDirectory?: string,
) {
	const arrPromises = secrets
		.map((secret) => {
			const command = `echo ${getSecret(secret)} | ${
				pkgManagerCmd.exec
			} wrangler secret put ${secret}`;
			return environment ? command.concat(` --env ${environment}`) : command;
		})
		.map(
			async (command) =>
				await execAsync(command, {
					cwd: workingDirectory,
					env: process.env,
				}),
		);

	await Promise.all(arrPromises);
}

async function uploadSecrets() {
	const secrets: string[] = config["secrets"];
	const environment = config["ENVIRONMENT"];
	const workingDirectory = config["workingDirectory"];

	if (!secrets.length) {
		return;
	}

	startGroup("🔑 Uploading secrets...");

	try {
		if (semverCompare(config["WRANGLER_VERSION"], "3.4.0"))
			return legacyUploadSecrets(secrets, environment, workingDirectory);

		const secretObj = secrets.reduce((acc: any, secret: string) => {
			acc[secret] = getSecret(secret);
			return acc;
		}, {});

		const environmentSuffix = !environment.length
			? ""
			: ` --env ${environment}`;

		const secretCmd = `echo "${JSON.stringify(secretObj).replaceAll(
			'"',
			'\\"',
		)}" | ${pkgManagerCmd.exec} wrangler secret:bulk ${environmentSuffix}`;

		execSync(secretCmd, {
			cwd: workingDirectory,
			env: process.env,
			stdio: "ignore",
		});

		info(`✅ Uploaded secrets`);
	} catch (err) {
		error(`❌ Upload failed`);
		throw new Error(`Failed to upload secrets.`);
	} finally {
		endGroup();
	}
}

function getVarArgs() {
	const vars = config["VARS"];
	const envVarArray = vars.map((envVar: string) => {
		if (process.env[envVar] && process.env[envVar]?.length !== 0) {
			return `${envVar}:${process.env[envVar]!}`;
		} else {
			throw new Error(`Value for var ${envVar} not found in environment.`);
		}
	});

	return envVarArray.length > 0 ? `--var ${envVarArray.join(" ").trim()}` : "";
}

async function wranglerCommands() {
	startGroup("🚀 Running Wrangler Commands");
	try {
		const commands = config["COMMANDS"];
		const environment = config["ENVIRONMENT"];

		if (!commands.length) {
			const wranglerVersion = config["WRANGLER_VERSION"];
			const deployCommand = semverCompare("2.20.0", wranglerVersion)
				? "deploy"
				: "publish";
			commands.push(deployCommand);
		}

		const arrPromises = commands.map(async (command) => {
			if (environment.length > 0 && !command.includes(`--env`)) {
				command = command.concat(` --env ${environment}`);
			}

			const cmd = `${pkgManagerCmd.exec} wrangler ${command} ${
				(command.startsWith("deploy") || command.startsWith("publish")) &&
				!command.includes(`--var`)
					? getVarArgs()
					: ""
			}`.trim();

			info(`🚀 Executing command: ${cmd}`);

			return await runProcess(cmd, {
				cwd: config["workingDirectory"],
				env: process.env,
			});
		});

		await Promise.all(arrPromises);
	} finally {
		endGroup();
	}
}

main();

export {
	authenticationSetup,
	execCommands,
	installWrangler,
	uploadSecrets,
	wranglerCommands,
};
