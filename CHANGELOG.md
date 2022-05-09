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