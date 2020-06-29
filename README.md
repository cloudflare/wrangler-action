# Wrangler GitHub Action

✨ Zero-config [Cloudflare Workers](https://workers.cloudflare.com) deployment using [Wrangler](https://github.com/cloudflare/wrangler) and [GitHub Actions](https://github.com/actions)

## Usage

Add `wrangler-action` to the workflow for your Workers application. The below example will publish your application on pushes to the `master` branch:

```yaml
name: Deploy

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v2
      - name: Publish
        uses: cloudflare/wrangler-action@1.2.0
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
      uses: cloudflare/wrangler-action@1.2.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
```

`wrangler-action` also supports using your [global API key and email](https://developers.cloudflare.com/workers/quickstart/#global-api-key) as an authentication method, although API tokens are preferred. Pass in `apiKey` and `email` to the GitHub Action to use this method:

```yaml
jobs:
  deploy:
    name: Deploy
    steps:
      uses: cloudflare/wrangler-action@1.2.0
      with:
        apiKey: ${{ secrets.CF_API_KEY }}
        email: ${{ secrets.CF_EMAIL }}
```

## Configuration

If you're using Wrangler's [environments](https://developers.cloudflare.com/workers/tooling/wrangler/configuration/environments/) feature, you can customize _where_ the action deploys to by passing an `environment` in the `with` block of your workflow:

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@1.2.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        environment: 'production'
```

If you need to install a specific version of Wrangler to use for deployment, you can also pass the input `wranglerVersion` to install a specific version of Wrangler from NPM. This should be a [SemVer](https://semver.org/)-style version number, such as `1.6.0`:

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@1.2.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        wranglerVersion: '1.6.0'
```

Optionally, you can also pass a `workingDirectory` key to the action. This will allow you to specify a subdirectory of the repo to run the Wrangler command from.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@1.2.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        workingDirectory: 'subfoldername'
```

[Worker secrets](https://developers.cloudflare.com/workers/tooling/wrangler/secrets/) can be optionally passed as a new line deliminated string of names in `secrets`.  Each secret name must match an environment variable name specified in the `env` attribute.  Creates or replaces the value for the Worker secret using the `wrangler secret put` command.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@1.2.0
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        secrets: |
            SECRET1
            SECRET2
      env:
        SECRET1: ${{ secrets.SECRET1 }}
        SECRET2: ${{ secrets.SECRET2 }}
```

## Use cases

### Deploying when commits are merged to master

The above workflow examples have already shown how to run `wrangler-action` when new commits are merged to the master branch. For most developers, this workflow will easily replace manual deploys and be a great first integration step with `wrangler-action`:

```yaml
on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@master
      - name: Publish
        uses: cloudflare/wrangler-action@1.2.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

Note that there are a number of possible events, like `push`, that can be used to trigger a workflow. For more details on the events available, check out the [GitHub Actions documentation](https://help.github.com/en/articles/workflow-syntax-for-github-actions#on).

### Deploying on a schedule

If you'd like to deploy your Workers application on a recurring basis – for instance, every hour, or daily – the `schedule` trigger allows you to use cron syntax to define a workflow schedule. The below example will deploy at the beginning of every hour:

```yaml
on:
  schedule:
    - cron: '0 * * * *'

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@master
      - name: Publish app
        uses: cloudflare/wrangler-action@1.2.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

If you need help defining the correct cron syntax, check out [crontab.guru](https://crontab.guru/), which provides a friendly user interface for validating your cron schedule.

### Deploying on a "dispatched" event

If you need to trigger a deployment at-will, you can use GitHub's API to fire a `repository_dispatch` event on your repository. By setting your workflow to trigger on that event, you'll be able to deploy your application via an API call:

```yaml
on:
  repository_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@master
      - name: Publish app
        uses: cloudflare/wrangler-action@1.2.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

To make the GitHub API request, you can deploy a custom [Cloudflare Workers](https://workers.cloudflare.com) function, which will send a `POST` request to GitHub's API and trigger a new deploy:

```js
const headers = {
  Accept: 'application/vnd.github.everest-preview+json',
  Authorization: 'Bearer $token',
}

const body = JSON.stringify({ event_type: 'repository_dispatch' })

const url = `https://api.github.com/repos/$owner/$repo/dispatches`

const handleRequest = async evt => {
  await fetch(url, { method: 'POST', headers, body })
  return new Response('OK')
}

addEventListener('fetch', handleRequest)
```

Note that `$token` in this code sample is a GitHub "Personal Access Token". For information on how to generate this token, see the [GitHub documentation on "repository_dispatch"](https://developer.github.com/v3/repos/#create-a-repository-dispatch-event).

## Troubleshooting

This action is in beta, and I'm looking for folks to use it! If something goes wrong, please file an issue! That being said, there's a couple things you should know:

### "I just started using Workers/Wrangler and I don't know what this is!"

No problem! Check out the [Quick Start guide](https://developers.cloudflare.com/workers/quickstart) in our docs to get started. Once you have a Workers application, you may want to set it up to automatically deploy from GitHub whenever you change your project. That's where this action comes in - nice!

### "I'm trying to deploy my static site but it isn't working!"

To deploy static sites and frontend applications to Workers, check out the documentation for [Workers Sites](https://developers.cloudflare.com/workers/sites).

Note that this action makes no assumptions about _how_ your project is built! **If you need to run a pre-publish step, like building your application, you need to specify a build step in your Workflow.** For instance, if I have an NPM command called `build`, my workflow TOML might resemble the following:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@master
      - name: Build site
        run: 'npm run build'
      - name: Publish
        uses: cloudflare/wrangler-action@1.2.0
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```
