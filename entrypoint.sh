#!/bin/bash

set -e

export HOME="/github/workspace"
export WRANGLER_HOME="/github/workspace"

mkdir -p "$HOME/.wrangler"
chmod -R 770 "$HOME/.wrangler"

export API_CREDENTIALS=""

# Used to execute any specified pre and post commands
execute_commands() {
  echo "$ Running: $1"
  COMMANDS=$1
  while IFS= read -r COMMAND; do
    CHUNKS=()

    for CHUNK in $COMMAND; do
      CHUNKS+=("$CHUNK")
    done

    eval "${CHUNKS[@]}"

    CHUNKS=()
  done <<< "$COMMANDS"
}

secret_not_found() {
  echo "::error::Specified secret \"$1\" not found in environment variables."
  exit 1
}

WRANGLER_VERSION=2

# If no Wrangler version is specified install v2.
if [ -z "$INPUT_WRANGLERVERSION" ]; then
  npm i -g wrangler

# If Wrangler version starts with 1 then install wrangler v1
elif [[ "$INPUT_WRANGLERVERSION" == 1* ]]; then
  npm i -g "@cloudflare/wrangler@$INPUT_WRANGLERVERSION"
  WRANGLER_VERSION=1

# Else install Wrangler 2
else
  npm i -g "wrangler@$INPUT_WRANGLERVERSION"
  WRANGLER_VERSION=2
fi

# If an API token is detected as input
if [ -n "$INPUT_APITOKEN" ]; then

  # Wrangler v1 uses CF_API_TOKEN but v2 uses CLOUDFLARE_API_TOKEN
  if [ $WRANGLER_VERSION == 1 ]; then
    export CF_API_TOKEN="$INPUT_APITOKEN"
  else
    export CLOUDFLARE_API_TOKEN="$INPUT_APITOKEN"
  fi

  export API_CREDENTIALS="API Token"
fi

# If an API key and email are detected as input
if [ -n "$INPUT_APIKEY" ] && [ -n "$INPUT_EMAIL" ]; then

  # Wrangler v1 uses CF_ but v2 uses CLOUDFLARE_
  if [ $WRANGLER_VERSION == 1 ]; then
    export CF_EMAIL="$INPUT_EMAIL"
    export CF_API_KEY="$INPUT_APIKEY"
  else
    echo "::error::Wrangler v2 does not support using the API Key. You should instead use an API token."
    exit 1
  fi
  
  export API_CREDENTIALS="Email and API Key"
fi

if [ -n "$INPUT_ACCOUNTID" ]; then

  if [ $WRANGLER_VERSION == 1 ]; then
    export CF_ACCOUNT_ID="$INPUT_ACCOUNTID"
  else
    export CLOUDFLARE_ACCOUNT_ID="$INPUT_ACCOUNTID"
  fi
  
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

# If a working directory is detected as input
if [ -n "$INPUT_WORKINGDIRECTORY" ]
then
  cd "$INPUT_WORKINGDIRECTORY"
fi

# If precommands is detected as input
if [ -n "$INPUT_PRECOMMANDS" ]
then
  execute_commands "$INPUT_PRECOMMANDS"
fi

# If we have secrets, set them
for SECRET in $INPUT_SECRETS; do
  VALUE=$(printenv "$SECRET") || secret_not_found "$SECRET"

  if [ -z "$INPUT_ENVIRONMENT" ]; then
    echo "$VALUE" | wrangler secret put "$SECRET"
  else
    echo "$VALUE" | wrangler secret put "$SECRET" --env "$INPUT_ENVIRONMENT"
  fi
done

# If there's no input command then default to publish otherwise run it
if [ -z "$INPUT_COMMAND" ]; then
  echo "::notice:: No command was provided, defaulting to 'publish'"

 if [ -z "$INPUT_ENVIRONMENT" ]; then
    wrangler publish
  else
    wrangler publish --env "$INPUT_ENVIRONMENT"
  fi

else
  if [ -n "$INPUT_ENVIRONMENT" ]; then
    echo "::notice::Since you have specified an environment you need to make sure to pass in '--env $INPUT_ENVIRONMENT' to your command."
  fi

  execute_commands "wrangler $INPUT_COMMAND"
fi

# If postcommands is detected as input
if [ -n "$INPUT_POSTCOMMANDS" ]
then
  execute_commands "$INPUT_POSTCOMMANDS"
fi

# If a working directory is detected as input, revert to the
# original directory before continuing with the workflow
if [ -n "$INPUT_WORKINGDIRECTORY" ]
then
  cd $HOME
fi
