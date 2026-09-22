#!/usr/bin/env bash

set -euo pipefail

npm run build
git add --force dist/index.mjs
git commit --message "Build action"
npx changeset tag

RELEASE_TAG="v$(node --print 'require("./package.json").version')"
git cat-file -e "${RELEASE_TAG}:dist/index.mjs"
