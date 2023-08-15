import {
	getInput,
	getMultilineInput,
	info,
	setFailed,
	endGroup,
	startGroup,
	error,
} from "@actions/core";
import { execSync, exec } from "node:child_process";
import { existsSync } from "node:fs";
import * as path from "node:path";
import * as util from "node:util";
const execAsync = util.promisify(exec);

const DEFAULT_WRANGLER_VERSION = "3.5.1";

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
} as const;

function getNpxCmd() {
	return process.env.RUNNER_OS === "Windows" ? "npx.cmd" : "npx";
}

/**
 * A helper function to compare two semver versions. If the second arg is greater than the first arg, it returns true.
 */
function semverCompare(version1: string, version2: string) {
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

async function main() {
	installWrangler();
	authenticationSetup();
	await execCommands(getMultilineInput("preCommands"), "pre");
	await uploadSecrets();
	await wranglerCommands();
	await execCommands(getMultilineInput("postCommands"), "post");
}

async function runProcess(
	command: Parameters<typeof execAsync>[0],
	options: Parameters<typeof execAsync>[1],
) {
	try {
		const result = await execAsync(command, options);

		result.stdout && info(result.stdout.toString());
		result.stderr && error(result.stderr.toString());

		return result;
	} catch (err: any) {
		err.stdout && info(err.stdout.toString());
		err.stderr && error(err.stderr.toString());
		throw err;
	}
}

function checkWorkingDirectory(workingDirectory = ".") {
	try {
		const normalizedPath = path.normalize(workingDirectory);
		if (existsSync(normalizedPath)) {
			return normalizedPath;
		} else {
			setFailed(`🚨 Directory ${workingDirectory} does not exist.`);
		}
	} catch (error) {
		setFailed(
			`🚨 While checking/creating directory ${workingDirectory} received ${error}`,
		);
	}
}

function installWrangler() {
	if (config["WRANGLER_VERSION"].startsWith("1")) {
		setFailed(
			`🚨 Wrangler v1 is no longer supported by this action. Please use major version 2 or greater`,
		);
	}
	startGroup("📥 Installing Wrangler");
	const command = `npm install wrangler@${config["WRANGLER_VERSION"]}`;
	info(`Running command: ${command}`);
	execSync(command, { cwd: config["workingDirectory"], env: process.env });
	info(`✅ Wrangler installed`);
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

	const arrPromises = commands.map(async (command) => {
		const cmd = command.startsWith("wrangler")
			? `${getNpxCmd()} ${command}`
			: command;

		info(`🚀 Executing command: ${cmd}`);

		return await runProcess(cmd, {
			cwd: config["workingDirectory"],
			env: process.env,
		});
	});

	await Promise.all(arrPromises).catch((result) => {
		result.stdout && info(result.stdout.toString());
		result.stderr && error(result.stderr.toString());
		setFailed(`🚨 ${cmdType}Commands failed`);
	});
	endGroup();
}

/**
 * A helper function to get the secret from the environment variables.
 */
function getSecret(secret: string) {
	if (!secret) {
		setFailed("No secret provided");
	}

	const value = process.env[secret];
	if (!value) {
		setFailed(`Secret ${secret} not found`);
	}

	return value;
}

async function legacyUploadSecrets(
	secrets: string[],
	environment?: string,
	workingDirectory?: string,
) {
	try {
		const arrPromises = secrets
			.map((secret) => {
				const command = `echo ${getSecret(
					secret,
				)} | ${getNpxCmd()} wrangler secret put ${secret}`;
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
	} catch {
		setFailed(`🚨 Error uploading secrets`);
	}
}

async function uploadSecrets() {
	const secrets: string[] = config["secrets"];
	const environment = config["ENVIRONMENT"];
	const workingDirectory = config["workingDirectory"];

	if (!secrets.length) {
		return;
	}
	try {
		startGroup("🔑 Uploading Secrets");

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
		)}" | ${getNpxCmd()} wrangler secret:bulk ${environmentSuffix}`;

		execSync(secretCmd, {
			cwd: workingDirectory,
			env: process.env,
			stdio: "ignore",
		});
		info(`✅ Uploaded secrets`);
	} catch {
		setFailed(`🚨 Error uploading secrets`);
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
			setFailed(`🚨 ${envVar} not found in variables.`);
		}
	});

	return envVarArray.length > 0 ? `--var ${envVarArray.join(" ").trim()}` : "";
}

async function wranglerCommands() {
	startGroup("🚀 Running Wrangler Commands");
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

		const cmd = `${getNpxCmd()} wrangler ${command} ${
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

	await Promise.all(arrPromises).catch((result) => {
		result.stdout && info(result.stdout.toString());
		result.stderr && error(result.stderr.toString());
		setFailed(`🚨 Command failed`);
	});

	endGroup();
}

main().catch(() => setFailed("🚨 Action failed"));

export {
	wranglerCommands,
	execCommands,
	uploadSecrets,
	authenticationSetup,
	installWrangler,
	checkWorkingDirectory,
	getNpxCmd,
	semverCompare,
};
