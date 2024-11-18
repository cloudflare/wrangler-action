---
"wrangler-action": patch
---

fix: Use wrangler secret put instead of deprecated secret:bulk command

`wrangler secret:bulk` is deprecated and will be removed in a future version. This also improves logging in cases where a secret is failing to upload because an environment variable with the same name already exists (see: #240).
