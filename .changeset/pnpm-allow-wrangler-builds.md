---
"wrangler-action": patch
---

Allow Wrangler's build scripts (esbuild, workerd, sharp) when installing Wrangler with pnpm 11 or later, which otherwise fails with `ERR_PNPM_IGNORED_BUILDS`.
