#!/bin/sh
set -eu

sh ./scripts/ios-build.sh
sh ./scripts/ios-submit.sh
