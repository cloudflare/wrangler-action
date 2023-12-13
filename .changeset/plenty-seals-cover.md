---
"wrangler-action": minor
---

This change introduces three new GitHub Action's output variables. These variables are as follows:

- `command-output` - contains the string results of `stdout`
- `command-stderr` - contains the string results of `stderr`
- `deployment-url` - contains the string results of the URL that was deployed (ex: `https://<your_pages_site>.pages.dev`)

These output variables are intended to be used by more advanced workflows that require the output results or deployment url from Wrangler commands in subsequent workflow steps.
