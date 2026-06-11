#!/bin/sh
set -eu

build_dir="./build/ios"
app_name="eboost-cms"

mkdir -p "$build_dir"

last_number="$(
  find "$build_dir" -maxdepth 1 -type f -name "$app_name-*.ipa" \
    | sed -n -E "s#^.*/$app_name-([0-9]+)\\.ipa$#\\1#p" \
    | sort -n \
    | tail -1
)"

if [ -z "$last_number" ]; then
  next_number="1"
else
  next_number="$(awk "BEGIN { print $last_number + 1 }")"
fi

padded_number="$(printf "%03d" "$next_number")"
output="$build_dir/$app_name-$padded_number.ipa"
latest="$build_dir/$app_name-latest.ipa"

eas build --platform ios --local --output "$output"
ln -sf "$(basename "$output")" "$latest"

printf "Built %s\n" "$output"
printf "Latest %s -> %s\n" "$latest" "$output"
