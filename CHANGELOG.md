# Changelog

## 3.0.2

### Patch Changes

- [#145](https://github.com/cloudflare/wrangler-action/pull/145) [`554eea1`](https://github.com/cloudflare/wrangler-action/commit/554eea134a56c1c05f54c44fa53c6432fb6405f6) Thanks [@JacobMGEvans](https://github.com/JacobMGEvans)! - Added more error logging when a command fails to execute
  Previously, we prevented any error logs from propagating too far to prevent leaking of any potentially sensitive information. However, this made it difficult for developers to debug their code.

  In this release, we have updated our error handling to allow for more error messaging from pre/post and custom commands. We still discourage the use of these commands for secrets or other sensitive information, but we believe this change will make it easier for developers to debug their code.

  Relates to #137

- [#145](https://github.com/cloudflare/wrangler-action/pull/145) [`554eea1`](https://github.com/cloudflare/wrangler-action/commit/554eea134a56c1c05f54c44fa53c6432fb6405f6) Thanks [@JacobMGEvans](https://github.com/JacobMGEvans)! - Adding Changesets

- [Version 3.0.0](#version-300)
- [Version 2.0.0](#version-200)

## Version 3.0.0 (Breaking update)

### Additions

- **Rewritten Wrangler Action in TypeScript.**
- Bulk secrets API utilization from Wrangler.
- Added testing for improved reliability.
- Implemented multiline support for the `command` input to allow running multiple Wrangler commands.
- Now using Node for the Action engine/runner.
- Open discussions with the community on all changes through GitHub Discussions and monitored Issues.

### Removals

- Removed Docker as a dependency.
- Dropped support for Wrangler v1.

### Changes

- Fixed CI/CD issues.

### Breaking changes

- Wrangler v1 is no longer supported.
  - Please update to the latest version of Wrangler.
- Updated default version of Wrangler to v3.4.0

### Additional Notes

- Major Version Default: [DEVX-632](https://jira.cfdata.org/browse/DEVX-632)
- Rewrite Project Tickets: [DEVX-804](https://jira.cfdata.org/browse/DEVX-804), [DEVX-802](https://jira.cfdata.org/browse/DEVX-802), [DEVX-800](https://jira.cfdata.org/browse/DEVX-800), [DEVX-632](https://jira.cfdata.org/browse/DEVX-632)

---

## Version 2.0.0 (Breaking update)

### Additions

- New `command` input
  - This allows you to specify the Wrangler command you would like to run.
    For example, if you want to publish the production version of your Worker you may run `publish --env=production`.
  - This opens up other possibilities too like publishing a Pages project: `pages publish <directory> --project-name=<name>`.
- New `accountId` input
  - This allows you to specify your account ID.

### Removals

- Removed `publish` input (refer to [Breaking changes](#breaking-changes)).

### Changes

-- no changes --

### Breaking changes

- `publish` has been removed.
  - You should instead do `command:
