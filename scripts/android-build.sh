#!/bin/sh
set -eu

sh ./scripts/android-build-artifact.sh apk
sh ./scripts/android-build-artifact.sh aab
