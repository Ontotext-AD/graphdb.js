#!/usr/bin/env bash

set -eu

# CodeClimate collects coverage via pre-built binary
curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter

chmod +x ./cc-test-reporter

./cc-test-reporter before-build
