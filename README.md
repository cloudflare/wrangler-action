# Wrangler GitHub Action

✨ Zero-config [Cloudflare Workers](https://workers.cloudflare.com) deployment using [Wrangler](https://github.com/cloudflare/wrangler) and [GitHub Actions](https://github.com/actions)

## Usage

Add `wrangler-action` to the workflow for your Workers application. The below example will publish your application on pushes to the `master` branch:

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
      uses: signalnerve/wrangler-action@0.1.0
      with:
        apiKey: ${{ secrets.CLOUDFLARE_API_KEY }}
        email: ${{ secrets.CLOUDFLARE_EMAIL }}
```

## Configuration

You'll need to configure Wrangler using GitHub's Secrets feature - go to "Settings -> Secrets" and add your Cloudflare API key and email (for help finding these, see the [Workers documentation](https://developers.cloudflare.com/workers/quickstart/#finding-your-cloudflare-api-keys)). Your API key and email are encrypted by GitHub, and the action won't print them into logs, so they should be safe!

With your API key and email set as secrets for your repository, pass them to the action in the `with` block of your workflow:

```yaml
jobs:
  deploy:
    name: Deploy
    steps:
      uses: signalnerve/wrangler-action@0.1.0
      with:
        apiKey: ${{ secrets.CLOUDFLARE_API_KEY }}
        email: ${{ secrets.CLOUDFLARE_EMAIL }}
```

Optionally, you can also pass an `environment` key to the action. If you're using Wrangler's [environments](https://github.com/cloudflare/wrangler/blob/master/docs/content/environments.md) feature, you can customize _where_ the action deploys to by passing the matching environment in the `with` block of your workflow:

```yaml
jobs:
  deploy:
    # ... previous configuration ...
    steps:
      uses: signalnerve/wrangler-action@0.1.0
      with:
        # ... api key and email ...
        environment: "production"
```

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
      run: "npm run build"
    - name: Publish
      uses: signalnerve/wrangler-action@0.1.0
      with:
        apiKey: ${{ secrets.CLOUDFLARE_API_KEY }}
        email: ${{ secrets.CLOUDFLARE_EMAIL }}
```
