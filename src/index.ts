import {
	getBooleanInput,
	getInput,
	getMultilineInput,
	endGroup as originalEndGroup,
	error as originalError,
	info as originalInfo,
	debug,
	startGroup as originalStartGroup,
	setFailed,
	setOutput,
} from "@actions/core";
import { exec, execShell } from "./exec";
import { checkWorkingDirectory, semverCompare } from "./utils";
import { getPackageManager } from "./packageManagers";

const DEFAULT_WRANGLER_VERSION = "3.13.2";

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

const packageManager = getPackageManager(config.PACKAGE_MANAGER, {
	workingDirectory: config.workingDirectory,
});

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
		authenticationSetup();
		await installWrangler();
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

async function installWrangler() {
	if (config["WRANGLER_VERSION"].startsWith("1")) {
		throw new Error(
			`Wrangler v1 is no longer supported by this action. Please use major version 2 or greater`,
		);
	}

	startGroup("📥 Installing Wrangler");
	try {
		await exec(
			packageManager.install,
			[`wrangler@${config["WRANGLER_VERSION"]}`],
			{
				cwd: config["workingDirectory"],
				silent: config["QUIET_MODE"],
			},
		);

		info(`✅ Wrangler installed`, true);
	} finally {
		endGroup();
	}
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
		for (const command of commands) {
			const cmd = command.startsWith("wrangler")
				? `${packageManager.exec} ${command}`
				: command;

			await execShell(cmd, {
				cwd: config["workingDirectory"],
				silent: config["QUIET_MODE"],
			});
		}
	} finally {
		endGroup();
	}
}

function getSecret(secret: string) {
	if (!secret) {
		throw new Error("Secret name cannot be blank.");
	}

	const value = process.env[secret];
	if (!value) {
		throw new Error(`Value for secret ${secret} not found in environment.`);
	}

	return value;
}

function getEnvVar(envVar: string) {
	if (!envVar) {
		throw new Error("Var name cannot be blank.");
	}

	const value = process.env[envVar];
	if (!value) {
		throw new Error(`Value for var ${envVar} not found in environment.`);
	}

	return value;
}

async function legacyUploadSecrets(
	secrets: string[],
	environment?: string,
	workingDirectory?: string,
) {
	for (const secret of secrets) {
		const args = ["wrangler", "secret", "put", secret];
		if (environment) {
			args.push("--env", environment);
		}
		await exec(packageManager.exec, args, {
			cwd: workingDirectory,
			silent: config["QUIET_MODE"],
			input: Buffer.from(getSecret(secret)),
		});
	}
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
		if (semverCompare(config["WRANGLER_VERSION"], "3.4.0")) {
			return legacyUploadSecrets(secrets, environment, workingDirectory);
		}

		const args = ["wrangler", "secret:bulk"];

		if (environment) {
			args.push("--env", environment);
		}

		await exec(packageManager.exec, args, {
			cwd: workingDirectory,
			silent: config["QUIET_MODE"],
			input: Buffer.from(
				JSON.stringify(
					Object.fromEntries(
						secrets.map((secret) => [secret, getSecret(secret)]),
					),
				),
			),
		});
	} catch (err: unknown) {
		if (err instanceof Error) {
			error(err.message);
			err.stack && debug(err.stack);
		}
		throw new Error(`Failed to upload secrets.`);
	} finally {
		endGroup();
	}
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

		for (let command of commands) {
			const args = [];

			if (environment && !command.includes("--env")) {
				args.push("--env", environment);
			}

			if (
				config["VARS"].length &&
				(command.startsWith("deploy") || command.startsWith("publish")) &&
				!command.includes("--var")
			) {
				args.push("--var");
				for (const v of config["VARS"]) {
					args.push(`${v}:${getEnvVar(v)}`);
				}
			}

			// Used for saving the wrangler output
			let stdOut = "";
			let stdErr = "";

			// Construct the options for the exec command
			const options = {
				cwd: config["workingDirectory"],
				silent: config["QUIET_MODE"],
				listeners: {
					stdout: (data: Buffer) => {
						stdOut += data.toString();
					},
					stderr: (data: Buffer) => {
						stdErr += data.toString();
					},
				},
			};

			// Execute the wrangler command
			await exec(`${packageManager.exec} wrangler ${command}`, args, options);

			// Set the outputs for the command
			setOutput("command-output", stdOut);
			setOutput("command-stderr", stdErr);

			// Check if this command is a workers or pages deployment
			if (
				command.startsWith("deploy") ||
				command.startsWith("publish") ||
				command.startsWith("pages publish") ||
				command.startsWith("pages deploy")
			) {
				// If this is a workers or pages deployment, try to extract the deployment URL
				let deploymentUrl = "";
				const deploymentUrlMatch = stdOut.match(/https?:\/\/[a-zA-Z0-9-./]+/);
				if (deploymentUrlMatch && deploymentUrlMatch[0]) {
					deploymentUrl = deploymentUrlMatch[0].trim();
					setOutput("deployment-url", deploymentUrl);
				}
			}
		}
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
