# Varlock Wrangler GitHub Action

Deploy Cloudflare Workers and Pages with [`varlock-wrangler`](https://varlock.dev/integrations/cloudflare/).

This action is a small fork of Cloudflare's Wrangler action that runs the Varlock wrapper instead of `wrangler` directly. It installs:

- `@varlock/cloudflare-integration`
- `varlock`
- `wrangler`

Then it runs your requested command as `varlock-wrangler <command>`.

## Why Use This

`varlock-wrangler` is a thin wrapper around Wrangler. It passes most commands through unchanged, but enhances the Cloudflare deployment flow:

- `varlock-wrangler dev` resolves Varlock env files, injects them into Miniflare, and restarts when env files change.
- `varlock-wrangler deploy` and `varlock-wrangler versions upload` upload non-sensitive values as Cloudflare vars and sensitive values as Cloudflare secrets from your `.env.schema`.
- `varlock-wrangler types` generates Cloudflare Worker types that include Varlock-managed variables.

Because Varlock owns env var and secret deployment, this action does not support the original `secrets` or `vars` inputs from `cloudflare/wrangler-action`.

## Project Setup

Your Worker project must be configured for Varlock before using this action.

Install Varlock locally:

```sh
npm install @varlock/cloudflare-integration varlock
```

Create or migrate your schema:

```sh
npm exec -- varlock init
```

Add the Varlock Cloudflare init import to your Worker entry point:

```ts
import "@varlock/cloudflare-integration/init";
```

Varlock also requires Cloudflare's Node.js compatibility flag:

```jsonc
{
	"compatibility_flags": ["nodejs_compat"],
}
```

## Usage

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Deploy
        uses: wladpaiva/varlock-wrangler-action@main
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

By default, the action runs:

```sh
varlock-wrangler deploy
```

## Commands

Use `command` to run any `varlock-wrangler` command. Omit the executable name:

```yaml
- uses: wladpaiva/varlock-wrangler-action@main
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: whoami
```

Multiple commands can be separated by newlines:

```yaml
- uses: wladpaiva/varlock-wrangler-action@main
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: |
      types
      deploy
```

Worker versions are supported:

```yaml
- uses: wladpaiva/varlock-wrangler-action@main
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: versions upload
```

## Inputs

| Input                                 | Required | Description                                                                                                                     |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `apiToken`                            | No       | Cloudflare API token. Set as `CLOUDFLARE_API_TOKEN` for Wrangler.                                                               |
| `accountId`                           | No       | Cloudflare account ID. Set as `CLOUDFLARE_ACCOUNT_ID` for Wrangler.                                                             |
| `command`                             | No       | Command arguments passed to `varlock-wrangler`. Defaults to `deploy`.                                                           |
| `environment`                         | No       | Adds `--env <environment>` when the command does not already include `--env`.                                                   |
| `workingDirectory`                    | No       | Directory where dependencies are installed and commands are run.                                                                |
| `varlockVersion`                      | No       | Version of `varlock` to install. Defaults to `latest`.                                                                          |
| `varlockCloudflareIntegrationVersion` | No       | Version of `@varlock/cloudflare-integration` to install. Defaults to `latest`.                                                  |
| `wranglerVersion`                     | No       | Version of `wrangler` to install as the wrapper peer dependency. Defaults to `^4`.                                              |
| `packageManager`                      | No       | Package manager to use: `npm`, `pnpm`, `yarn`, `bun`, or `vp`. Auto-detected from lockfiles when omitted.                       |
| `skipInstall`                         | No       | Skip installing Varlock/Wrangler dependencies when they are already installed by an earlier workflow step. Defaults to `false`. |
| `preCommands`                         | No       | Shell commands to run before the Varlock Wrangler command. Lines starting with `wrangler` are run through `varlock-wrangler`.   |
| `postCommands`                        | No       | Shell commands to run after the Varlock Wrangler command. Lines starting with `wrangler` are run through `varlock-wrangler`.    |
| `quiet`                               | No       | Suppress command output. Defaults to `false`.                                                                                   |
| `gitHubToken`                         | No       | GitHub token used for Pages deployment metadata and job summaries.                                                              |

## Outputs

| Output                       | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `command-output`             | stdout from the last `varlock-wrangler` command.          |
| `command-stderr`             | stderr from the last `varlock-wrangler` command.          |
| `deployment-url`             | Worker or Pages deployment URL when Wrangler reports one. |
| `pages-deployment-alias-url` | Pages or Worker version preview alias URL when available. |
| `pages-deployment-id`        | Pages deployment ID when available.                       |
| `pages-environment`          | Pages deployment environment when available.              |

When `command` is `versions upload` and Wrangler reports preview URLs, the action also adds a GitHub job summary with the deployment URL and preview alias URL.

## Environment Variables and Secrets

Do not pass Worker variables or secrets through this action. Define them in `.env.schema` and the matching `.env` files instead.

During deploy, `varlock-wrangler` resolves your schema and env files, then sends non-sensitive values as Cloudflare vars and sensitive values as Cloudflare secrets.

Important: `varlock-wrangler deploy` replaces Cloudflare plain vars and secrets with the values defined by Varlock. Vars or secrets managed manually in the Cloudflare dashboard can be removed by the next deploy if they are not represented in your schema.

Cloudflare resource bindings such as KV, D1, R2, Durable Objects, and Queues still belong in your Wrangler config.

## Package Managers

The action detects the package manager from lockfiles in `workingDirectory`:

- `package-lock.json` -> npm
- `yarn.lock` -> yarn
- `pnpm-lock.yaml` -> pnpm
- `bun.lockb` or `bun.lock` -> bun

Override detection with:

```yaml
- uses: wladpaiva/varlock-wrangler-action@main
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    packageManager: pnpm
```

## Notes

For Vite-based Cloudflare projects, Varlock also offers `varlockCloudflareVitePlugin`. You can still use this action for deployment; set your project build step in `preCommands` or your workflow before invoking the action.
