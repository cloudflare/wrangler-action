# 2.8.1 (Pages Branch bug fix)
* New `pagesDirectory` input
    * automatically adds `wrangler pages publish` (inptu command included)
* New `pagesProject` input
    * adds `--project-name=<>`to default command (input command included)

* All 2 inputs are for Cloudflare pages, you can deploy to pages without using command.
    * populating the above inputs will change the use if command function to an extenstion.
    For example - if you use pagesDirectory and pagesProject along with command. it will exec `wrangler pages publish <dir> <command>`
    If you use the command input without the 2 pages variables, it will exec `wrangler <command>`
    Order pagesDirectory > command > pagesProject > pagesBranch > env

* New `pagesBranch` input
    * workaround for Cloudflare Pages not detecting branches (input command included)
# 2.0.0 (Breaking update)

## Additions

* New `command` input
    * This allows you to specify the Wrangler command you would like to run.
    For example, if you want to publish the production version of your Worker you may run `publish --env=production`.
    * This opens up other possibilities too like publishing a Pages project: `pages publish <directory> --project-name=<name>`.
* New `accountId` input
  * This allows you to specify your account ID.

## Removals

* Removed `publish` input (refer to [Breaking changes](#breaking-changes)).

## Changes

-- no changes --

## __Breaking changes__

* `publish` has been removed.
  * You should instead do `command: publish`.