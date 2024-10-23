# Changelog

## 3.10.0

### Minor Changes

- [#303](https://github.com/cloudflare/wrangler-action/pull/303) [`3ec7f8943ef83351f743cfaa8763a9056ef70993`](https://github.com/cloudflare/wrangler-action/commit/3ec7f8943ef83351f743cfaa8763a9056ef70993) Thanks [@courtney-sims](https://github.com/courtney-sims)! - Support id, environment, url, and alias outputs for Pages deploys.

## 3.9.0

### Minor Changes

- [#298](https://github.com/cloudflare/wrangler-action/pull/298) [`134b5c2a3252d66b8c4d1cddd0b9baaeed6a4daa`](https://github.com/cloudflare/wrangler-action/commit/134b5c2a3252d66b8c4d1cddd0b9baaeed6a4daa) Thanks [@Maximo-Guk](https://github.com/Maximo-Guk)! - Update wrangler version from 3.13.2 to 3.78.10

### Patch Changes

- [#278](https://github.com/cloudflare/wrangler-action/pull/278) [`47d51f25c113ee9205110728599b43ed6a1e273b`](https://github.com/cloudflare/wrangler-action/commit/47d51f25c113ee9205110728599b43ed6a1e273b) Thanks [@acusti](https://github.com/acusti)! - fix: Detect existing wrangler install even when wrangler version output is multiline

## 3.8.0

### Minor Changes

- [#291](https://github.com/cloudflare/wrangler-action/pull/291) [`a1467a0c8f2a058f8d43a4d0c40a55176ed5efe6`](https://github.com/cloudflare/wrangler-action/commit/a1467a0c8f2a058f8d43a4d0c40a55176ed5efe6) Thanks [@Ambroos](https://github.com/Ambroos)! - Adds `deployment-alias-url` output for Pages deployment aliases (since Wrangler v3.78.0): https://github.com/cloudflare/workers-sdk/pull/6643

## 3.7.0

### Minor Changes

- [#271](https://github.com/cloudflare/wrangler-action/pull/271) [`66efca2cbb82a5a49df6af2e14c4b58d53b0e266`](https://github.com/cloudflare/wrangler-action/commit/66efca2cbb82a5a49df6af2e14c4b58d53b0e266) Thanks [@Maximo-Guk](https://github.com/Maximo-Guk)! - This unreverts #235 ensuring wrangler-action will re-use existing wrangler installations, thanks @AdiRishi! and ensures we don't automatically install wrangler when checking if it present

## 3.6.1

### Patch Changes

- [#265](https://github.com/cloudflare/wrangler-action/pull/265) [`2d275a8f2d279dc91912c1ff8023af109ef3280c`](https://github.com/cloudflare/wrangler-action/commit/2d275a8f2d279dc91912c1ff8023af109ef3280c) Thanks [@Maximo-Guk](https://github.com/Maximo-Guk)! - Reverts #235 which may have caused the latest version of wrangler to be installed, if no wrangler version was found

## 3.6.0

### Minor Changes

- [#235](https://github.com/cloudflare/wrangler-action/pull/235) [`0545ad285acaff2b92053d636ee17fb303b4c5f5`](https://github.com/cloudflare/wrangler-action/commit/0545ad285acaff2b92053d636ee17fb303b4c5f5) Thanks [@AdiRishi](https://github.com/AdiRishi)! - wrangler-action will now re-use existing wrangler installations when available

## 3.5.0

### Minor Changes

- [#255](https://github.com/cloudflare/wrangler-action/pull/255) [`31a6263ef3ec73ff2d03cb4c0260379f96f7598c`](https://github.com/cloudflare/wrangler-action/commit/31a6263ef3ec73ff2d03cb4c0260379f96f7598c) Thanks [@matthewdavidrodgers](https://github.com/matthewdavidrodgers)! - Stop racing secret uploads

  For up to date versions of wrangler, secrets are uploaded via the 'secret:bulk' command, which batches updates in a single API call.

  For versions of wrangler without that capability, the action falls back to the single 'secret put' command for each secret. It races all these with a Promise.all()

  Unfortunately, the single secret API cannot handle concurrency - at best, these calls have to wait on one another, holding requests open all the while. Often it times out and errors.

  This fixes the legacy secret upload errors by making these calls serially instead of concurrently.

## 3.4.1

### Patch Changes

- [#227](https://github.com/cloudflare/wrangler-action/pull/227) [`bbedd8e54f256d36f81f81f1f05b90937d533bb7`](https://github.com/cloudflare/wrangler-action/commit/bbedd8e54f256d36f81f81f1f05b90937d533bb7) Thanks [@AdiRishi](https://github.com/AdiRishi)! - Surface inner exception when secret:bulk upload command fails

## 3.4.0

### Minor Changes

- [#213](https://github.com/cloudflare/wrangler-action/pull/213) [`d13856dfc92816473ebf47f66e263a2668a97896`](https://github.com/cloudflare/wrangler-action/commit/d13856dfc92816473ebf47f66e263a2668a97896) Thanks [@GrantBirki](https://github.com/GrantBirki)! - This change introduces three new GitHub Actions output variables. These variables are as follows:

  - `command-output` - contains the string results of `stdout`
  - `command-stderr` - contains the string results of `stderr`
  - `deployment-url` - contains the string results of the URL that was deployed (ex: `https://<your_pages_site>.pages.dev`)

  These output variables are intended to be used by more advanced workflows that require the output results or deployment url from Wrangler commands in subsequent workflow steps.

### Patch Changes

- [#216](https://github.com/cloudflare/wrangler-action/pull/216) [`9aba9c34daabca23a88191a5fe1b81fa721c1f11`](https://github.com/cloudflare/wrangler-action/commit/9aba9c34daabca23a88191a5fe1b81fa721c1f11) Thanks [@Cherry](https://github.com/Cherry)! - Fixes issues with semver comparison, where version parts were treated lexicographically instead of numerically.

  Bulk secret uploading was introduced in wrangler `3.4.0`, and this action tries to check if the version used is greater than `3.4.0`, and then if so, using the new bulk secret API which is faster. Due to a bug in the semver comparison, `3.19.0` was being considered less than `3.4.0`, and then using an older and slower method for uploading secrets.

  Now the semver comparison is fixed, the faster bulk method is used for uploading secrets when available.

## 3.3.2

### Patch Changes

- [#171](https://github.com/cloudflare/wrangler-action/pull/171) [`76d614f`](https://github.com/cloudflare/wrangler-action/commit/76d614f400bd92237ed23c3df559f2c31b14a790) Thanks [@1000hz](https://github.com/1000hz)! - Fixed issues that caused the action to fail if any secret or var values contained shell metacharacters.

- [#171](https://github.com/cloudflare/wrangler-action/pull/171) [`473d9cb`](https://github.com/cloudflare/wrangler-action/commit/473d9cbd296528b41c653af10062faba6540a7ab) Thanks [@1000hz](https://github.com/1000hz)! - Bumped `DEFAULT_WRANGLER_VERSION` to 3.13.2

## 3.3.1

### Patch Changes

- [#193](https://github.com/cloudflare/wrangler-action/pull/193) [`a4509d5`](https://github.com/cloudflare/wrangler-action/commit/a4509d507c62dd7f49fba7df7d2db3997222393a) Thanks [@1000hz](https://github.com/1000hz)! - Fixed the package manager not being inferred based on lockfile when the `packageManager` input isn't set.

## 3.3.0

### Minor Changes

- [#188](https://github.com/cloudflare/wrangler-action/pull/188) [`d9a0a00`](https://github.com/cloudflare/wrangler-action/commit/d9a0a00f8bc502ceea2a60e5af258416b35a85b9) Thanks [@simpleauthority](https://github.com/simpleauthority)! - Added support for Bun as a package manager

## 3.2.1

### Patch Changes

- [#190](https://github.com/cloudflare/wrangler-action/pull/190) [`528687a`](https://github.com/cloudflare/wrangler-action/commit/528687aaf436f67565918533ffd15c250f39c47b) Thanks [@1000hz](https://github.com/1000hz)! - Fixed action failure when no `packageManager` specified and no lockfile is found. The action now falls back to using npm.

## 3.2.0

### Minor Changes

- [#166](https://github.com/cloudflare/wrangler-action/pull/166) [`7d7b988`](https://github.com/cloudflare/wrangler-action/commit/7d7b98826e14e9ad422870a7263b7074b40bf16f) Thanks [@nix6839](https://github.com/nix6839)! - Support for package managers other than npm, such as pnpm and yarn.

  fixes #156

## 3.1.1

### Patch Changes

- [#161](https://github.com/cloudflare/wrangler-action/pull/161) [`e5251df`](https://github.com/cloudflare/wrangler-action/commit/e5251df52154e9ebc98edb02ee0598c7210dcf0f) Thanks [@1000hz](https://github.com/1000hz)! - Refactored error handling to stop execution when action fails. Previously, the action would continue executing to completion if one of the steps encountered an error. Fixes #160.

## 3.1.0

### Minor Changes

- [#154](https://github.com/cloudflare/wrangler-action/pull/154) [`3f40637`](https://github.com/cloudflare/wrangler-action/commit/3f40637a1c48016d2101e412a7a06f1eb4b9c2fd) Thanks [@JacobMGEvans](https://github.com/JacobMGEvans)! - feat: Quiet mode
  Some of the stderr, stdout, info & groupings can be a little noisy for some users and use cases.
  This feature allows for a option to be passed 'quiet: true' this would significantly reduce the noise.

  There will still be output that lets the user know Wrangler Installed and Wrangler Action completed successfully.
  Any failure status will still be output to the user as well, to prevent silent failures.

  resolves #142

## 3.0.2

### Patch Changes

- [#147](https://github.com/cloudflare/wrangler-action/pull/147) [`58f274b`](https://github.com/cloudflare/wrangler-action/commit/58f274b9f70867447519c6fa983c813e2b167b85) Thanks [@JacobMGEvans](https://github.com/JacobMGEvans)! - Added more error logging when a command fails to execute
  Previously, we prevented any error logs from propagating too far to prevent leaking of any potentially sensitive information. However, this made it difficult for developers to debug their code.

  In this release, we have updated our error handling to allow for more error messaging from pre/post and custom commands. We still discourage the use of these commands for secrets or other sensitive information, but we believe this change will make it easier for developers to debug their code.

  Relates to #137

- [#147](https://github.com/cloudflare/wrangler-action/pull/147) [`58f274b`](https://github.com/cloudflare/wrangler-action/commit/58f274b9f70867447519c6fa983c813e2b167b85) Thanks [@JacobMGEvans](https://github.com/JacobMGEvans)! - Adding Changesets

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
