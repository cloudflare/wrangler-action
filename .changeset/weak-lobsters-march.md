---
"wrangler-action": patch
---

Fixes issues with semver comparison, where version parts were treated lexicographically instead of numerically.

Bulk secret uploading was introduced in wrangler `3.4.0`, and this action tries to check if the version used is greater than `3.4.0`, and then if so, using the new bulk secret API which is faster. Due to a bug in the semver comparison, `3.19.0` was being considered less than `3.4.0`, and then using an older and slower method for uploading secrets.

Now the semver comparison is fixed, the faster bulk method is used for uploading secrets when available.
