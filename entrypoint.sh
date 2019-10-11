#!/bin/sh

set -e

export HOME="/github/workspace"
export NVM_DIR="/github/workspace/nvm"
export WRANGLER_HOME="/github/workspace"

function install_nvm() {
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh | bash
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
}

function main() {
  mkdir -p "$HOME/.wrangler"
  chmod -R 777 "$HOME/.wrangler"

  install_nvm

	sanitize "${INPUT_EMAIL}" "email"
  export CLOUDFLARE_EMAIL="$INPUT_EMAIL"
 	sanitize "${INPUT_APIKEY}" "apiKey"
  export CLOUDFLARE_API_KEY="$INPUT_APIKEY"

  npm i @cloudflare/wrangler -g
  npm i

  wrangler whoami
  wrangler publish
}

# h/t https://github.com/elgohr/Publish-Docker-Github-Action
function sanitize() {
  if [ -z "${1}" ]; then
    >&2 echo "Unable to find the ${2}. Did you set with.${2}?"
    exit 1
  fi
}

main
