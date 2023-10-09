---
"wrangler-action": patch
---

Fixed action failure when no `packageManager` specified and no lockfile is found. The action now falls back to using npm.
