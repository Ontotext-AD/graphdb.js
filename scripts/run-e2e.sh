#!/bin/bash

docker compose --env-file .env -f docker-compose-e2e.yml build --no-cache

docker compose --env-file .env -f docker-compose-e2e.yml up --abort-on-container-exit --exit-code-from e2e-tests
