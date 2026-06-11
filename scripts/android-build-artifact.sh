#!/bin/sh
set -eu

artifact_type="${1:-}"

case "$artifact_type" in
  apk)
    profile="android-apk"
    extension="apk"
    ;;
  aab)
    profile="android-aab"
    extension="aab"
    ;;
  *)
    printf "Usage: sh ./scripts/android-build-artifact.sh apk|aab\n" >&2
    exit 1
    ;;
esac

build_dir="./build/android"
app_name="eboost-cms"

mkdir -p "$build_dir"

last_number="$(
  find "$build_dir" -maxdepth 1 -type f -name "$app_name-*.$extension" \
    | sed -n -E "s#^.*/$app_name-([0-9]+)\\.$extension$#\\1#p" \
    | sort -n \
    | tail -1
)"

if [ -z "$last_number" ]; then
  next_number="1"
else
  next_number="$(awk "BEGIN { print $last_number + 1 }")"
fi

padded_number="$(printf "%03d" "$next_number")"
output="$build_dir/$app_name-$padded_number.$extension"
latest="$build_dir/$app_name-latest.$extension"

eas build --platform android --profile "$profile" --local --output "$output"
ln -sf "$(basename "$output")" "$latest"

printf "Built %s\n" "$output"
printf "Latest %s -> %s\n" "$latest" "$output"
