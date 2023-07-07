import {
  getInput,
  getMultilineInput,
  info,
  notice,
  setFailed,
  warning,
} from "@actions/core";
import { execSync, spawnSync } from "node:child_process";
import * as path from "node:path";

const config = {
  WRANGLER_VERSION: Number(getInput("wranglerVersion") ?? 3),
  bulkSecrets: getInput("bulkSecrets"), // should be JSON
  secrets: getMultilineInput("secrets"),
  workingDirectory: checkWorkingDirectory(getInput("workingDirectory")),
  API_CREDENTIALS: getInput("API_CREDENTIALS"),
  CF_API_TOKEN: getInput("CF_API_TOKEN"),
  CLOUDFLARE_API_TOKEN: getInput("CLOUDFLARE_API_TOKEN"),
  CF_EMAIL: getInput("CF_EMAIL"),
  CF_API_KEY: getInput("CF_API_KEY"),
  CF_ACCOUNT_ID: getInput("CF_ACCOUNT_ID"),
  CLOUDFLARE_ACCOUNT_ID: getInput("CLOUDFLARE_ACCOUNT_ID"),
};

export async function main() {
  installWrangler(getInput("wranglerVersion"));
  authenticationSetup(
    getInput("apiToken"),
    getInput("apiKey"),
    getInput("email"),
    getInput("accountId")
  );
  execCommands(getMultilineInput("preCommands"));
  uploadSecrets(getMultilineInput("secrets"), getInput("environment"));
  genericCommand(
    getInput("command"),
    getInput("environment"),
    getMultilineInput("vars")
  );
  execCommands(getMultilineInput("postCommands"));
}

function checkWorkingDirectory(workingDirectory = "") {
  try {
    return path.normalize(workingDirectory);
  } catch (error) {
    throw setFailed(` invalid path: ${workingDirectory} Error: ${error}`);
  }
}

function installWrangler(INPUT_WRANGLERVERSION: string) {
  let packageName = "wrangler";
  let versionToUse = "";

  if (INPUT_WRANGLERVERSION.startsWith("1")) {
    // If Wrangler version starts with 1 then install wrangler v1
    packageName = "@cloudflare/wrangler";
    versionToUse = `@${INPUT_WRANGLERVERSION}`;
    config.WRANGLER_VERSION = 1;
  } else {
    // install Wrangler 2
    versionToUse = `@${INPUT_WRANGLERVERSION}`;
    config.WRANGLER_VERSION = Number(INPUT_WRANGLERVERSION[0]);
  }

  const command = `npm install ${packageName}${versionToUse}`;
  info(command);

  execSync(command, { cwd: config.workingDirectory, env: process.env });
}

async function authenticationSetup(
  INPUT_APITOKEN: string,
  INPUT_APIKEY: string,
  INPUT_EMAIL: string,
  INPUT_ACCOUNTID: string
) {
  /** 
   * Wrangler v1 uses CF_API_TOKEN but v2 uses CLOUDFLARE_API_TOKEN
   * */

  if (INPUT_APITOKEN.length !== 0) {
    if (config.WRANGLER_VERSION === 1) {
      config.CF_API_TOKEN = INPUT_APITOKEN;
      process.env.CF_API_TOKEN = INPUT_APITOKEN;
    } else {
      config.CLOUDFLARE_API_TOKEN = INPUT_APITOKEN;
      process.env.CLOUDFLARE_API_TOKEN = INPUT_APITOKEN;
    }

    config.API_CREDENTIALS = "API Token";
  }

  if (INPUT_APIKEY.length !== 0 && INPUT_EMAIL.length !== 0) {
    if (config.WRANGLER_VERSION === 1) {
      config.CF_EMAIL = INPUT_EMAIL;
      process.env.CF_EMAIL = INPUT_EMAIL;
      config.CF_API_KEY = INPUT_APIKEY;
      process.env.CF_API_KEY = INPUT_APIKEY;
    } else {
      setFailed(
        "Wrangler v2 does not support using the API Key. You should instead use an API token."
      );
    }

    config.API_CREDENTIALS = "Email and API Key";
  }

  if (INPUT_ACCOUNTID.length !== 0) {
    if (config.WRANGLER_VERSION === 1) {
      config.CF_ACCOUNT_ID = INPUT_ACCOUNTID;
      process.env.CF_ACCOUNT_ID = INPUT_ACCOUNTID;
    } else {
      config.CLOUDFLARE_ACCOUNT_ID = INPUT_ACCOUNTID;
      process.env.CLOUDFLARE_ACCOUNT_ID = INPUT_ACCOUNTID;
    }
  }

  if (INPUT_APIKEY.length !== 0 && INPUT_EMAIL.length === 0) {
    warning(
      `An API key was provided without a corresponding email for authentication. Please ensure both 'apiKey' and 'email' are passed to the action.`
    );
  }

  if (INPUT_APIKEY.length === 0 && INPUT_EMAIL.length !== 0) {
    setFailed(
      `An email was provided without a corresponding API key for authentication. Please ensure both 'apiKey' and 'email' are passed to the action.`
    );
  }

  if (config.API_CREDENTIALS.length === 0) {
    setFailed(
      `Authentication details were not found. Please input an 'apiToken' to the action, or use the legacy 'apiKey' and 'email'.`
    );
  } else {
    info(`Authentication process initiated with - ${config.API_CREDENTIALS}`);
  }
}

async function execCommands(commands: string[]) {
  for (const command of commands) {
    const npxCommand = command.startsWith("wrangler")
      ? command
      : "npx " + command;

    info(`🚀 Executing command: ${npxCommand}`);

    execSync(npxCommand, { cwd: config.workingDirectory, env: process.env });
  }
}

async function uploadSecrets(
  INPUT_SECRETS: string[],
  INPUT_ENVIRONMENT: string
) {
  return new Promise(async (mainResolve, mainReject) => {
    for (const secret of INPUT_SECRETS) {
      if (!process.env[secret] && process.env[secret]?.length === 0) {
        mainReject(setFailed(`🚨 ${secret} not found in variables.`));
      }

      const wranglerCommand = config.WRANGLER_VERSION === 1 ? "@cloudflare/wrangler" : "wrangler"
      const npxCommand = process.env.RUNNER_OS === "Windows" ? "npx.cmd" : "npx";

      // Dedupe the commands to run, secrets with same name will be overwritten
      const secretCmds = new Set<string>();
      // construct the command to run
      const environmentSuffix = INPUT_ENVIRONMENT.length === 0 ? "" : ` --env ${INPUT_ENVIRONMENT}`;
      secretCmds.add(`${npxCommand} ${wranglerCommand} secret put ${secret}${environmentSuffix}`);

      // Take all the commands and execute them in parallel 
      await Promise.all(Array.from(secretCmds).map(async (secretCmd) => {
        await new Promise<void>((childResolve, childReject) => {
          const child = spawnSync(secretCmd, {
            cwd: config.workingDirectory,
            env: process.env,
            stdio: "pipe",
          });

          child.status === 0 ? childResolve() : childReject(setFailed(new Error(`Secrets command exited with code ${child.status}`)));
        });
      })).then(() => mainResolve(info(`✅ Uploaded secret: ${secret}`)))
    }
  });
}

async function genericCommand(
  INPUT_COMMAND: string,
  INPUT_ENVIRONMENT: string,
  INPUT_VARS: string[]
) {
  let wranglerCommand = "wrangler";
  if (config.WRANGLER_VERSION === 1) {
    wranglerCommand = "@cloudflare/wrangler";
  }

  if (INPUT_COMMAND.length === 0) {
    let deployCommand = "deploy";
    if (config.WRANGLER_VERSION !== 3) {
      deployCommand = "publish";
    }

    warning(
      `ℹ️ No commands were provided, falling back to '${deployCommand}'`
    );

    const envVars = new Map<string, string>();
    let envVarArg = "";
    if (INPUT_VARS.length > 0) {
      for (const envVar of INPUT_VARS) {
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

    if (INPUT_ENVIRONMENT.length === 0) {
      execSync(
        `npx ${wranglerCommand} ${deployCommand} ${envVarArg}`.trim(),
        { cwd: config.workingDirectory, env: process.env }
      );
    } else {
      execSync(
        `npx ${wranglerCommand} ${deployCommand} --env ${INPUT_ENVIRONMENT} ${envVarArg}`.trim(),
        { cwd: config.workingDirectory, env: process.env }
      );
    }
  } else {
    if (INPUT_ENVIRONMENT.length === 0) {
      warning(
        `ℹ️ An environment as been specified adding '--env ${INPUT_ENVIRONMENT}' is required in the command.`
      );
    }

    return execCommands([`npx ${wranglerCommand} ${INPUT_COMMAND}`]);
  }
}

main().catch((error) => {
  setFailed(error);
});
