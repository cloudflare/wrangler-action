#!/bin/sh

set -e

export HOME="/github/workspace"
export NVM_DIR="/github/workspace/nvm"
export WRANGLER_HOME="/github/workspace"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh | bash

# Comments beginning with "shellcheck" use shellcheck, a shell script linter.
# The below comments ignore shellcheck linting on the instructions provided
# by NVM.

# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

mkdir -p "$HOME/.wrangler"
chmod -R 770 "$HOME/.wrangler"

export API_CREDENTIALS=""

# If an API token is detected as input
if [ -n "$INPUT_APITOKEN" ]
then
  export CF_API_TOKEN="$INPUT_APITOKEN"
  export API_CREDENTIALS="API Token"
fi

# If an API key and email are detected as input
if [ -n "$INPUT_APIKEY" ] && [ -n "$INPUT_EMAIL" ]
then
  export CF_EMAIL="$INPUT_EMAIL"
  export CF_API_KEY="$INPUT_APIKEY"
  export API_CREDENTIALS="Email and API Key"
fi

if [ -n "$INPUT_APIKEY" ] && [ -z "$INPUT_EMAIL" ]
then
  echo "Provided an API key without an email for authentication. Please pass in 'apiKey' and 'email' to the action."
fi

if [ -z "$INPUT_APIKEY" ] && [ -n "$INPUT_EMAIL" ]
then
  echo "Provided an email without an API key for authentication. Please pass in 'apiKey' and 'email' to the action."
  exit 1
fi

if [ -z "$API_CREDENTIALS" ]
then
  >&2 echo "Unable to find authentication details. Please pass in an 'apiToken' as an input to the action, or a legacy 'apiKey' and 'email'."
  exit 1
else
  echo "Using $API_CREDENTIALS authentication"
fi

# If a Wrangler version is detected as input
if [ -z "$INPUT_WRANGLERVERSION" ]
then
  npm i @cloudflare/wrangler -g
else
  npm i "@cloudflare/wrangler@$INPUT_WRANGLERVERSION" -g
fi

# If a working directory is detected as input
if [ -n "$INPUT_WORKINGDIRECTORY" ]
then
  cd "$INPUT_WORKINGDIRECTORY"
fi

# If an environment is detected as input
if [ -z "$INPUT_ENVIRONMENT" ]
then
  wrangler publish
else
  wrangler publish -e "$INPUT_ENVIRONMENT"
fi

# If a working directory is detected as input, revert to the
# original directory before continuing with the workflow
if [ -n "$INPUT_WORKINGDIRECTORY" ]
then
  cd $HOME
fi
