#!/bin/bash

set -e

export HOME="/github/workspace"
export PATH=$PATH:$NODE_HOME/bin

mkdir -p "$HOME/.wrangler"
chmod -R 770 "$HOME/.wrangler"

export API_CREDENTIALS=""

# If an API token is detected as input
if [ -n "$INPUT_APITOKEN" ]; then
  export CF_API_TOKEN="$INPUT_APITOKEN"
  export API_CREDENTIALS="API Token"
fi

# If an API key and email are detected as input
if [ -n "$INPUT_APIKEY" ] && [ -n "$INPUT_EMAIL" ]; then
  export CF_EMAIL="$INPUT_EMAIL"
  export CF_API_KEY="$INPUT_APIKEY"
  export API_CREDENTIALS="Email and API Key"
fi

if [ -n "$INPUT_APIKEY" ] && [ -z "$INPUT_EMAIL" ]; then
  echo "Provided an API key without an email for authentication. Please pass in 'apiKey' and 'email' to the action."
fi

if [ -z "$INPUT_APIKEY" ] && [ -n "$INPUT_EMAIL" ]; then
  echo "Provided an email without an API key for authentication. Please pass in 'apiKey' and 'email' to the action."
  exit 1
fi

if [ -z "$API_CREDENTIALS" ]; then
  echo >&2 "Unable to find authentication details. Please pass in an 'apiToken' as an input to the action, or a legacy 'apiKey' and 'email'."
  exit 1
else
  echo "Using $API_CREDENTIALS authentication"
fi

# If a working directory is detected as input
if [ -n "$INPUT_WORKINGDIRECTORY" ]; then
  cd "$INPUT_WORKINGDIRECTORY"
fi

# If an environment is detected as input
if [ -z "$INPUT_ENVIRONMENT" ]; then
  wrangler publish
else
  wrangler publish -e "$INPUT_ENVIRONMENT"
fi

# If a working directory is detected as input, revert to the
# original directory before continuing with the workflow
if [ -n "$INPUT_WORKINGDIRECTORY" ]; then
  cd $HOME
fi
