import {
	debug,
	getMultilineInput,
	endGroup as originalEndGroup,
	startGroup as originalStartGroup,
	setFailed,
	setOutput,
} from "@actions/core";
import { getExecOutput } from "@actions/exec";
import semverEq from "semver/functions/eq";
import { z } from "zod";
import { exec, execShell } from "./exec";
import { PackageManager } from "./packageManagers";
import { error, info, semverCompare } from "./utils";
import { handleCommandOutputParsing } from "./commandOutputParsing";
import semverLt from "semver/functions/lt";

export type WranglerActionConfig = z.infer<typeof wranglerActionConfig>;
export const wranglerActionConfig = z.object({
	WRANGLER_VERSION: z.string(),
	didUserProvideWranglerVersion: z.boolean(),
	secrets: z.array(z.string()),
	workingDirectory: z.string(),
	CLOUDFLARE_API_TOKEN: z.string(),
	CLOUDFLARE_ACCOUNT_ID: z.string(),
	ENVIRONMENT: z.string(),
	VARS: z.array(z.string()),
	COMMANDS: z.array(z.string()),
	QUIET_MODE: z.boolean(),
	PACKAGE_MANAGER: z.string(),
	WRANGLER_OUTPUT_DIR: z.string(),
	GITHUB_TOKEN: z.string(),
	DEPLOYMENT_NAME: z.string().optional(),
});

function startGroup(config: WranglerActionConfig, name: string): void {
	if (!config.QUIET_MODE) {
		originalStartGroup(name);
	}
}

function endGroup(config: WranglerActionConfig): void {
	if (!config.QUIET_MODE) {
		originalEndGroup();
	}
}

async function main(
	config: WranglerActionConfig,
	packageManager: PackageManager,
) {
	try {
		wranglerActionConfig.parse(config);
		authenticationSetup(config);
		await installWrangler(config, packageManager);
		await execCommands(
			config,
			packageManager,
			getMultilineInput("preCommands"),
			"pre",
		);
		await uploadSecrets(config, packageManager);
		await wranglerCommands(config, packageManager);
		await execCommands(
			config,
			packageManager,
			getMultilineInput("postCommands"),
			"post",
		);
		info(config, "🏁 Wrangler Action completed", true);
	} catch (err: unknown) {
		err instanceof Error && error(config, err.message);
		setFailed("🚨 Action failed");
	}
}

async function installWrangler(
	config: WranglerActionConfig,
	packageManager: PackageManager,
) {
	if (config["WRANGLER_VERSION"].startsWith("1")) {
		throw new Error(
			`Wrangler v1 is no longer supported by this action. Please use major version 2 or greater`,
		);
	}

	startGroup(config, "🔍 Checking for existing Wrangler installation");
	let installedVersion = "";
	let installedVersionSatisfiesRequirement = false;
	try {
		const { stdout } = await getExecOutput(
			// We want to simply invoke wrangler to check if it's installed, but don't want to auto-install it at this stage
			packageManager.execNoInstall,
			["wrangler", "--version"],
			{
				cwd: config["workingDirectory"],
				silent: config.QUIET_MODE,
			},
		);

		// There are two possible outputs from `wrangler --version`:
		// ` ⛅️ wrangler 3.48.0 (update available 3.53.1)`
		// and
		// `3.48.0`
		const versionMatch =
			stdout.match(/wrangler (\d+\.\d+\.\d+)/) ??
			stdout.match(/^(\d+\.\d+\.\d+)/m);
		if (versionMatch) {
			installedVersion = versionMatch[1];
		}
		if (config.didUserProvideWranglerVersion) {
			installedVersionSatisfiesRequirement = semverEq(
				installedVersion,
				config["WRANGLER_VERSION"],
			);
		}
		if (!config.didUserProvideWranglerVersion && installedVersion) {
			info(
				config,
				`✅ No wrangler version specified, using pre-installed wrangler version ${installedVersion}`,
				true,
			);
			endGroup(config);
			return;
		}
		if (
			config.didUserProvideWranglerVersion &&
			installedVersionSatisfiesRequirement
		) {
			info(config, `✅ Using Wrangler ${installedVersion}`, true);
			endGroup(config);
			return;
		}
		info(
			config,
			"⚠️ Wrangler not found or version is incompatible. Installing...",
			true,
		);
	} catch (error) {
		debug(`Error checking Wrangler version: ${error}`);
		info(
			config,
			"⚠️ Wrangler not found or version is incompatible. Installing...",
			true,
		);
	} finally {
		endGroup(config);
	}

	startGroup(config, "📥 Installing Wrangler");
	try {
		await exec(
			packageManager.install,
			[`wrangler@${config["WRANGLER_VERSION"]}`],
			{
				cwd: config["workingDirectory"],
				silent: config["QUIET_MODE"],
			},
		);

		info(config, `✅ Wrangler installed`, true);
	} finally {
		endGroup(config);
	}
}

function authenticationSetup(config: WranglerActionConfig) {
	process.env.CLOUDFLARE_API_TOKEN = config["CLOUDFLARE_API_TOKEN"];
	process.env.CLOUDFLARE_ACCOUNT_ID = config["CLOUDFLARE_ACCOUNT_ID"];
}

async function execCommands(
	config: WranglerActionConfig,
	packageManager: PackageManager,
	commands: string[],
	cmdType: string,
) {
	if (!commands.length) {
		return;
	}

	startGroup(config, `🚀 Running ${cmdType}Commands`);
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
		endGroup(config);
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
	config: WranglerActionConfig,
	packageManager: PackageManager,
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

async function uploadSecrets(
	config: WranglerActionConfig,
	packageManager: PackageManager,
) {
	const secrets: string[] = config["secrets"];
	const environment = config["ENVIRONMENT"];
	const workingDirectory = config["workingDirectory"];

	if (!secrets.length) {
		return;
	}

	startGroup(config, "🔑 Uploading secrets...");

	try {
		if (semverCompare(config["WRANGLER_VERSION"], "3.4.0")) {
			return legacyUploadSecrets(
				config,
				packageManager,
				secrets,
				environment,
				workingDirectory,
			);
		}

		let args = ["wrangler", "secret", "bulk"];
		// if we're on a WRANGLER_VERSION prior to 3.60.0 use wrangler secret:bulk
		if (semverLt(config["WRANGLER_VERSION"], "3.60.0")) {
			args = ["wrangler", "secret:bulk"];
		}

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
			error(config, err.message);
			err.stack && debug(err.stack);
		}
		throw new Error(`Failed to upload secrets.`);
	} finally {
		endGroup(config);
	}
}

async function wranglerCommands(
	config: WranglerActionConfig,
	packageManager: PackageManager,
) {
	startGroup(config, "🚀 Running Wrangler Commands");
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

			// set WRANGLER_OUTPUT_FILE_DIRECTORY env for exec
			process.env.WRANGLER_OUTPUT_FILE_DIRECTORY = config.WRANGLER_OUTPUT_DIR;

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

			// Handles setting github action outputs and creating github deployment and job summary
			await handleCommandOutputParsing(config, command, stdOut);
		}
	} finally {
		endGroup(config);
	}
}

export {
	authenticationSetup,
	execCommands,
	info,
	installWrangler,
	main,
	uploadSecrets,
	wranglerCommands,
};
