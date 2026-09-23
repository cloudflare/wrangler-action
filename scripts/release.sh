#!/usr/bin/env bash

set -euo pipefail

# Compile the action and create the same generated commit that
# build-and-tag-action previously created without changing main.
npm run build
git add --force dist/index.mjs
git commit --message "Automatic compilation"

RELEASE_TAG="v$(node --print 'require("./package.json").version')"
MAJOR_TAG="${RELEASE_TAG%%.*}"

# Create and verify the exact version tag locally. changesets/action pushes this
# tag and creates its immutable GitHub release only after this script succeeds.
npx changeset tag
git cat-file -e "${RELEASE_TAG}:dist/index.mjs"

# Update the floating major tag only if it has not moved since checkout. An
# empty expected object protects creation of a new major tag such as v5.
EXPECTED_MAJOR_OBJECT="$(git rev-parse --verify "refs/tags/${MAJOR_TAG}" 2>/dev/null || true)"
git push \
  --force-with-lease="refs/tags/${MAJOR_TAG}:${EXPECTED_MAJOR_OBJECT}" \
  origin \
  "HEAD:refs/tags/${MAJOR_TAG}"

# Fetch the remote result and prove both tags resolve to the compiled commit.
git fetch --force origin "refs/tags/${MAJOR_TAG}:refs/tags/${MAJOR_TAG}"
git cat-file -e "${MAJOR_TAG}:dist/index.mjs"
test "$(git rev-parse "${RELEASE_TAG}^{commit}")" = "$(git rev-parse "${MAJOR_TAG}^{commit}")"
