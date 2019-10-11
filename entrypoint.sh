#!/bin/sh

set -e

export HOME="/github/workspace"
export NVM_DIR="/github/workspace/nvm"
export WRANGLER_HOME="/github/workspace"

mkdir -p "$HOME/.wrangler"
chown root: "$HOME/.wrangler"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

if [ -n "$CLOUDFLARE_API_KEY" ]; then
  echo "CLOUDFLARE_API_KEY env var needs to be set. Add this field in the 'Secrets' section of your repo's settings."
  exit 1
fi

if [ -n "$CLOUDFLARE_EMAIL" ]; then
  echo "CLOUDFLARE_EMAIL env var needs to be set. Add this field in the 'Secrets' section of your repo's settings."
  exit 1
fi

npm i @cloudflare/wrangler -g
npm i

wrangler whoami
wrangler publish
