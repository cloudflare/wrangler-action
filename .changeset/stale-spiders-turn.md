---
"wrangler-action": patch
---

Refactored error handling to stop execution when action fails. Previously, the action would continue executing to completion if one of the steps encountered an error. Fixes #160.
