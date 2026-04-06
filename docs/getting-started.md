# Getting Started with `wrangler-action` from Scratch

This guide walks you through every step needed to deploy a Cloudflare Workers or Pages project using this GitHub Action, starting from zero.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine)
- A GitHub repository containing the project you want to deploy

## Step 1: Create a Cloudflare API Token

The GitHub Action authenticates with Cloudflare using an API token. You must create one with the right permissions.

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) and click your profile icon (top right), then **My Profile**.
2. Select **API Tokens** in the left sidebar.
3. Click **Create Token**.
4. Use the **Edit Cloudflare Workers** template (this covers both Workers and Pages). Alternatively, create a custom token with only the permissions you need:
   - **Account** > **Cloudflare Pages** > **Edit** (if deploying a Pages project)
   - **Account** > **Workers Scripts** > **Edit** (if deploying a Worker)
   - **Account** > **Account Settings** > **Read**
   - **Zone** > **Zone** > **Read** (if your Worker uses a custom domain)

   > You do not need both Pages and Workers permissions — include only what applies to your project.
5. Under **Account Resources**, select the account you want to deploy to.
6. Click **Continue to summary**, then **Create Token**.
7. **Copy the token** — you won't be able to see it again.

## Step 2: Find Your Cloudflare Account ID

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com).
2. Select any zone (domain), or go to **Workers & Pages**.
3. Your **Account ID** is shown on the right sidebar. Copy it.

You can also find it in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`

## Step 3: Add Secrets to Your GitHub Repository

Store your Cloudflare credentials as GitHub Actions secrets so they stay encrypted and never appear in logs.

1. In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** and add:
   - **Name:** `CLOUDFLARE_API_TOKEN` — **Value:** the API token from Step 1
   - **Name:** `CLOUDFLARE_ACCOUNT_ID` — **Value:** the account ID from Step 2

## Step 4: Set Up Your Project

### For Cloudflare Workers

If you don't have a Workers project yet:

```sh
npx wrangler init my-worker
cd my-worker
```

This creates a `wrangler.toml` configuration file and a basic Worker. Push it to your GitHub repo.

The `wrangler.toml` file must be in the root of your repository (or in the directory specified by the `workingDirectory` input if you use one). The action looks for it automatically — you do not need to pass it as a parameter.

Your `wrangler.toml` should include at minimum:

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
```

> **Note:** You do _not_ need to set `account_id` in `wrangler.toml` if you pass `accountId` to the GitHub Action (recommended — keeps credentials out of your repo).

### For Cloudflare Pages

If you have a static site (e.g. built with mkdocs, Next.js, Astro, etc.):

1. **You do not need to create a Pages project in the Cloudflare dashboard first.** The `wrangler pages deploy` command will create it for you on the first run.
2. Make sure your build step produces a directory of static files (e.g. `site/`, `dist/`, `build/`).

## Step 5: Create the GitHub Actions Workflow

Create a file at `.github/workflows/deploy.yml` in your repository.

### Workers Example

```yaml
name: Deploy Worker

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Pages Example (e.g. for an mkdocs site)

```yaml
name: Deploy Pages Site

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - name: Build site
        run: |
          pip install mkdocs-material
          mkdocs build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy site --project-name=my-docs-site
```

Replace `site` with your build output directory and `my-docs-site` with whatever you want your Pages project to be named. If the project doesn't exist yet, Wrangler will create it automatically.

## Step 6: Push and Verify

1. Commit and push the workflow file to your `main` branch.
2. Go to the **Actions** tab in your GitHub repository.
3. You should see the workflow running. Click into it to see logs.
4. Once successful, your site/worker will be live at:
   - **Workers:** `https://my-worker.<your-subdomain>.workers.dev`
   - **Pages:** `https://my-docs-site.pages.dev`

## Common Issues

### "No account id found, quitting..."

Either add `accountId` to the action inputs (recommended) or set `account_id` in your `wrangler.toml`:

```yaml
with:
  apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### "Authentication error"

Make sure your API token has the correct permissions (see Step 1) and that the `CLOUDFLARE_API_TOKEN` secret is set correctly in your repository settings.

### Pages project not found

If using `pages deploy`, Wrangler will create the project automatically on the first deploy. Make sure:
- You're specifying a `--project-name`
- Your API token has Pages edit permissions
- You've set the `accountId`

### Preview deployments

Pushes to non-production branches automatically create preview deployments. You can access them at `https://<branch>.<project>.pages.dev`. To deploy only on `main`, restrict the workflow trigger:

```yaml
on:
  push:
    branches:
      - main
```

## Next Steps

- See the [README](../README.md) for the full list of action inputs, outputs, and advanced usage (secrets, pre/post commands, custom wrangler versions, etc.)
- See the [Cloudflare Workers docs](https://developers.cloudflare.com/workers/) and [Pages docs](https://developers.cloudflare.com/pages/) for platform-specific guidance
- See [Wrangler documentation](https://developers.cloudflare.com/workers/wrangler/) for CLI reference
