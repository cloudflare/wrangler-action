import {
  getInput,
  getMultilineInput,
  info,
  setFailed,
  warning,
} from "@actions/core";
import { execSync, spawnSync } from "node:child_process";
import * as path from "node:path";

const config = new Map<string, any>([
  ["WRANGLER_VERSION", Number(getInput("wranglerVersion") ?? 3)],
  ["bulkSecrets", getInput("bulkSecrets")], // should be JSON
  ["secrets", getMultilineInput("secrets")],
  ["workingDirectory", checkWorkingDirectory(getInput("workingDirectory"))],
  ["API_CREDENTIALS", ""],
  ["CLOUDFLARE_API_TOKEN", getInput("apiToken")],
  ["CLOUDFLARE_ACCOUNT_ID", getInput("accountId")],
  ["ENVIRONMENT", getInput("environment")],
  ["VARS", getInput("vars")],
  ["COMMANDS", getInput("commands")],
]);

export async function main() {
  installWrangler();
  authenticationSetup();
  await execCommands(getMultilineInput("preCommands"));
  await uploadSecrets();
  await genericCommand();
  await execCommands(getMultilineInput("postCommands"));
}

function checkWorkingDirectory(workingDirectory = "") {
  try {
    return path.normalize(workingDirectory);
  } catch (error) {
    throw setFailed(` invalid path: ${workingDirectory} Error: ${error}`);
  }
}

function installWrangler() {
  const command = `npm install wrangler@${config.get("WRANGLER_VERSION")}`;
  info(command);

  execSync(command, { cwd: config.get("workingDirectory"), env: process.env });
}

function authenticationSetup() {
  try {
    const CLOUDFLARE_ACCOUNT_ID = config.get("CLOUDFLARE_ACCOUNT_ID");
    const CLOUDFLARE_API_TOKEN = config.get("CLOUDFLARE_API_TOKEN");
    process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN;
    process.env.CLOUDFLARE_ACCOUNT_ID = CLOUDFLARE_ACCOUNT_ID;
    info(`Authentication process initiated with - API Token`);
  } catch (error) {
    setFailed(
      `Authentication details were not found. Please input an 'apiToken' to the action.`
    );
  }
}

async function execCommands(commands: string[]) {
  for (const command of commands) {
    const npxCommand = command.startsWith("wrangler")
      ? `npx ${command}`
      : command;

    info(`🚀 Executing command: ${npxCommand}`);

    execSync(npxCommand, {
      cwd: config.get("workingDirectory"),
      env: process.env,
    });
  }
}

async function uploadSecrets() {
  const secrets: string[] = config.get("secrets")
    ? JSON.parse(config.get("bulkSecrets"))
    : config.get("secrets"); // TODO going to use Wrangler secret bulk upload
  const environment = config.get("ENVIRONMENT");
  const workingDirectory = config.get("workingDirectory");

  const promises = secrets.map(async (secret) => {
    if (!process.env[secret] || process.env[secret]?.length === 0) {
      throw new Error(`🚨 ${secret} not found in variables.`);
    }

    const npxCommand = process.env.RUNNER_OS === "Windows" ? "npx.cmd" : "npx";

    const environmentSuffix =
      environment.length === 0 ? "" : ` --env ${environment}`;
    const secretCmd = `${npxCommand} wrangler secret put ${secret}${environmentSuffix}`;

    const child = spawnSync(secretCmd, {
      cwd: workingDirectory,
      env: process.env,
      stdio: "pipe",
    });

    if (child.status !== 0) {
      throw new Error(`Secrets command exited with code ${child.status}`);
    }

    info(`✅ Uploaded secret: ${secret}`);
  });

  try {
    await Promise.all(promises);
  } catch (err) {
    setFailed(err as Error);
  }
}

async function genericCommand() {
  const wranglerVersion = config.get("WRANGLER_VERSION");
  const commands = config.get("COMMANDS");
  const environment = config.get("ENVIRONMENT");
  const vars = config.get("VARS");
  const workingDirectory = config.get("workingDirectory");

  if (commands.length === 0) {
    let deployCommand = wranglerVersion !== 3 ? "publish" : "deploy";

    warning(`ℹ️ No commands were provided, falling back to '${deployCommand}'`);

    const envVars = new Map<string, string>();
    let envVarArg = "";
    if (vars.length > 0) {
      for (const envVar of vars) {
        if (process.env[envVar] && process.env[envVar]?.length !== 0) {
          envVars.set(envVar, process.env[envVar]!);
        } else {
          throw setFailed(`🚨 ${envVar} not found in variables.`);
        }
      }
      envVarArg =
        "--var " +
        Array.from(envVars)
          .map(([key, value]) => `${key}:${value}`)
          .join(" ")
          .trim();
    }

    if (environment.length === 0) {
      execSync(`npx wrangler ${deployCommand} ${envVarArg}`.trim(), {
        cwd: workingDirectory,
        env: process.env,
      });
    } else {
      execSync(
        `npx wrangler ${deployCommand} --env ${environment} ${envVarArg}`.trim(),
        { cwd: workingDirectory, env: process.env }
      );
    }
  } else {
    if (environment.length === 0) {
      warning(
        `ℹ️ An environment as been specified adding '--env ${environment}' is required in the command.`
      );
    }

    return execCommands([`npx wrangler ${commands}`]);
  }
}

main().catch((error) => {
  setFailed(error);
});
