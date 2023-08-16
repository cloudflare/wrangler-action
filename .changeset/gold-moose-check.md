---
"wrangler-action": minor
---

feat: Quiet mode
Some of the stderr, stdout, info & groupings can be a little noisy for some users and use cases.
This feature allows for a option to be passed 'quiet: true' this would significantly reduce the noise.

There will still be output that lets the user know Wrangler Installed and Wrangler Action completed successfully.
Any failure status will still be output to the user as well, to prevent silent failures.

resolves #142
