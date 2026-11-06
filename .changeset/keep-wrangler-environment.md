---
"wrangler-action": patch
---

Honor the `environment` input when a Wrangler command uses `--env-file`, unless it explicitly selects an environment with `--env` or `-e`.
