#!/usr/bin/env bash

set -euo pipefail

npm run build
git add --force dist/index.mjs
git commit --message "Build action"

RELEASE_TAG="v$(node --print 'require("./package.json").version')"
MAJOR_TAG="${RELEASE_TAG%%.*}"
git push --force origin "HEAD:refs/tags/${MAJOR_TAG}"
git fetch --force origin "refs/tags/${MAJOR_TAG}:refs/tags/${MAJOR_TAG}"
git cat-file -e "${MAJOR_TAG}:dist/index.mjs"
test "$(git rev-parse HEAD)" = "$(git rev-parse "${MAJOR_TAG}^{commit}")"

npx changeset tag
git cat-file -e "${RELEASE_TAG}:dist/index.mjs"
test "$(git rev-parse "${RELEASE_TAG}^{commit}")" = "$(git rev-parse "${MAJOR_TAG}^{commit}")"
