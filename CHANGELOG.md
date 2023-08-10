# Changelog

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
