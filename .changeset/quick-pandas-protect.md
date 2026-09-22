---
"wrangler-action": patch
---

Add a `workerName` input that targets secret uploads and Wrangler commands which accept `--name` at the same Worker. Commands that include `--name` now fail when secrets are configured and direct users to the structured input.
