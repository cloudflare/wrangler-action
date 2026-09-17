---
"wrangler-action": patch
---

Add a `workerName` input that targets deploy or publish commands and secret uploads at the same Worker. Commands that include `--name` now fail when secrets are configured and direct users to the structured input.
