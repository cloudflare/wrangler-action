---
"wrangler-action": patch
---

Fixes #317: Generate a new output directory with a randomUUID in the tmpDir, so that when the action is executed multiple times, we use the artifacts from that run, opposed to the artifacts from a previous run.
