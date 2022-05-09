# Wrangler GitHub Action

Easy-to-use GitHub Action to use [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/). Makes deploying Workers, Pages or modifying R2 easy to do.

[Refer to Changelog for more information](CHANGELOG.md).

## Usage

Add `wrangler-action` to the workflow for your Workers/Pages application. The below example will publish a Worker on a `git push` to the `main` branch:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v2
      - name: Publish
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

## Authentication

You'll need to configure Wrangler using GitHub's Secrets feature - go to "Settings -> Secrets" and add your Cloudflare API token (for help finding this, see the [Workers documentation](https://developers.cloudflare.com/workers/quickstart/#api-token)). Your API token is encrypted by GitHub, and the action won't print it into logs, so it should be safe!

With your API token set as a secret for your repository, pass it to the action in the `with` block of your workflow. Below, I've set the secret name to `CF_API_TOKEN`:

```yaml
jobs:
  deploy:
    name: Deploy
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
```

`wrangler-action` also supports using your [global API key and email](https://developers.cloudflare.com/workers/quickstart/#global-api-key) as an authentication method, although API tokens are preferred. Pass in `apiKey` and `email` to the GitHub Action to use this method:

```yaml
jobs:
  deploy:
    name: Deploy
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiKey: ${{ secrets.CF_API_KEY }}
        email: ${{ secrets.CF_EMAIL }}
```

## Configuration

If you need to install a specific version of Wrangler to use for deployment, you can also pass the input `wranglerVersion` to install a specific version of Wrangler from NPM. This should be a [SemVer](https://semver.org/)-style version number, such as `1.6.0`:

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        wranglerVersion: '1.6.0'
```

Optionally, you can also pass a `workingDirectory` key to the action. This will allow you to specify a subdirectory of the repo to run the Wrangler command from.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        workingDirectory: 'subfoldername'
```

[Worker secrets](https://developers.cloudflare.com/workers/tooling/wrangler/secrets/) can be optionally passed as a new line deliminated string of names in `secrets`.  Each secret name must match an environment variable name specified in the `env` attribute.  Creates or replaces the value for the Worker secret using the `wrangler secret put` command.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        secrets: |
            SECRET1
            SECRET2
      env:
        SECRET1: ${{ secrets.SECRET1 }}
        SECRET2: ${{ secrets.SECRET2 }}
```

If you need to run additional shell commands before or after your command, you can specify them as input to `preCommands` (before `publish`) or `postCommands` (after `publish`). These can include additional `wrangler` commands (that is, `whoami`, `kv:key put`) or any other commands available inside the `wrangler-action` context.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        preCommands: echo "*** pre command ***"
        postCommands: |
          echo "*** post commands ***"
          wrangler kv:key put --binding=MY_KV key2 value2
          echo "******"
```

You can use the `command` option to do specific actions such as running `wrangler whoami` against your project:

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        command: whoami
```

## Use cases

### Deploy when commits are merged to main

The above workflow examples have already shown how to run `wrangler-action` when new commits are merged to the main branch. For most developers, this workflow will easily replace manual deploys and be a great first integration step with `wrangler-action`:

```yaml
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Publish
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

Note that there are a number of possible events, like `push`, that can be used to trigger a workflow. For more details on the events available, refer to the [GitHub Actions documentation](https://help.github.com/en/articles/workflow-syntax-for-github-actions#on).

### Deploy your Pages site (production & preview)

If you want to deploy your Pages project with GitHub Actions rather than the built-in continous integration (CI), then this is a great way to do it. Wrangler 2 will populate the commit message and branch for you. You only need to pass the project name. If a push to a non-production branch is done, it will publish as a preview deployment:

```yaml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Publish
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          command: pages publish --project-name=example
```

### Deploying on a schedule

If you would like to deploy your Workers application on a recurring basis – for example, every hour, or daily – the `schedule` trigger allows you to use cron syntax to define a workflow schedule. The below example will deploy at the beginning of every hour:

```yaml
on:
  schedule:
    - cron: '0 * * * *'

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Publish app
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

If you need help defining the correct cron syntax, check out [crontab.guru](https://crontab.guru/), which provides a friendly user interface for validating your cron schedule.

### Manually triggering a deployment

If you need to trigger a workflow at-will, you can use GitHub's `workflow_dispatch` [event](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_dispatch) in your workflow file. By setting your workflow to trigger on that event, you will be able to deploy your application via the GitHub UI. The UI also accepts inputs that can be used to configure the action:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Choose an environment to deploy to: <dev|staging|prod>'
        required: true
        default: 'dev'
jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Publish app
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: publish --env ${{ github.event.inputs.environment }}
```

For more advanced usage or to programmatically trigger the workflow from scripts, refer to [the GitHub documentation](https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event) for making API calls.

## Troubleshooting

### "I just started using Workers/Wrangler and I don't know what this is!"

Refer to the [Quick Start guide](https://developers.cloudflare.com/workers/quickstart) to get started. Once you have a Workers application, you may want to set it up to automatically deploy from GitHub whenever you change your project.

### "[ERROR] No account id found, quitting.."

You will need to add `account_id = ""` in your `wrangler.toml` file or set `accountId` in this GitHub Action.

```yaml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Publish app
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
```