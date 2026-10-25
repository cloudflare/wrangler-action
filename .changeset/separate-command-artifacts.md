---
"wrangler-action": patch
---

Fix outputs such as `deployment-url` being set from an earlier command's Wrangler output file when `command` has more than one line. Each command now writes its output file to its own directory.
