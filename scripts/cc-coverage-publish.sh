#!/usr/bin/env bash

set -eu

./cc-test-reporter after-build -t lcov --exit-code $TRAVIS_TEST_RESULT
