#!/bin/sh

set -e

npm i
npm i @cloudflare/wrangler -g
wrangler whoami
wrangler publish
