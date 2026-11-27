#!/bin/sh
# Runs the acceptance tests in Docker. The console shows the build and the test
# output, but not the GraphDB log, which is written to graphdb.log.
# The Jenkinsfile mirrors these steps with Compose v1, a fixed project name and
# no TTY, and publishes the JUnit report.

COMPOSE="docker compose --env-file .env -f docker-compose-e2e.yml"

# Stops on a failed build, so the tests never run on an older image
$COMPOSE build --no-cache || exit $?

$COMPOSE up -d --force-recreate --remove-orphans graphdb
# Removes the tests container left by an interrupted run
docker rm -f e2e-tests > /dev/null 2>&1
$COMPOSE run --name e2e-tests e2e-tests
EXIT_CODE=$?

$COMPOSE logs --no-color graphdb > graphdb.log
docker rm -f e2e-tests > /dev/null
$COMPOSE down --remove-orphans

exit $EXIT_CODE
