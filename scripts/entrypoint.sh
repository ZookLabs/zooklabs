#!/usr/bin/env bash
file=$(pwd)/bin/"google-credentials.json"
echo "$GOOGLE_CREDENTIALS" >"$file"
export GOOGLE_APPLICATION_CREDENTIALS=$file
exec "$1"
