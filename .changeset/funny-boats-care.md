---
"wrangler-action": minor
---

Stop racing secret uploads

For up to date versions of wrangler, secrets are uploaded via the 'secret:bulk' command, which batches updates in a single API call.

For versions of wrangler without that capability, the action falls back to the single 'secret put' command for each secret. It races all these with a Promise.all()

Unfortunately, the single secret API cannot handle concurrency - at best, these calls have to wait on one another, holding requests open all the while. Often it times out and errors.

This fixes the legacy secret upload errors by making these calls serially instead of concurrently.
