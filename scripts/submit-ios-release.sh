#!/bin/sh
set -eu

latest="./releases/ios/eboost-cms-latest.ipa"

if [ ! -e "$latest" ]; then
  printf "No latest iOS release found at %s\n" "$latest" >&2
  printf "Run npm run build first.\n" >&2
  exit 1
fi

eas submit --platform ios --path "$latest"
