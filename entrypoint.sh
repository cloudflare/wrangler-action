#!/bin/sh

set -e

if [ -n "$CLOUDFLARE_API_KEY" ]; then
  echo "CLOUDFLARE_API_KEY env var needs to be set. Add this field in the 'Secrets' section of your repo's settings."
  exit 1
fi

if [ -n "$CLOUDFLARE_EMAIL" ]; then
  echo "CLOUDFLARE_EMAIL env var needs to be set. Add this field in the 'Secrets' section of your repo's settings."
  exit 1
fi

npm i
npm i @cloudflare/wrangler -g
wrangler whoami
wrangler publish
