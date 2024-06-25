---
"wrangler-action": minor
---

feature: Set DEFAULT_WRANGLER_VERSION to 3.x

This will ensure that wrangler-action will use the latest compatible version of Wrangler if not specified otherwise.

There are two ways to lock down the version of Wrangler for this action:

- Specify the required version in the action's parameters when implementing it in your Github Workflows.
- Add a dependency to a specific version in your package.json of the project being deployed via this action.
