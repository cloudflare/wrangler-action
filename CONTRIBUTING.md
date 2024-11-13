# Contributing Guide

## Releases

### Changesets

Every non-trivial change to the project - those that should appear in the changelog - must be captured in a "changeset". We use the changesets tool for creating changesets, publishing versions and updating the changelog.

Create a changeset for the current change.

> npx changeset
> Select which workspaces are affected by the change and whether the version requires a major, minor or patch release.
> Update the generated changeset with a description of the change.
> Include the generate changeset in the current commit.
> git add ./changeset/\*.md

### Version Packages PRs

Once you merge your PR, a new Version Packages PR will be opened in the wrangler-action repo. Once that PR is merged, your change will be released. Example: https://github.com/cloudflare/wrangler-action/pull/305

Note: Version Packages PRs are only generated if there's been at least one PR merged with a changeset.
