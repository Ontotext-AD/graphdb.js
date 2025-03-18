#!/bin/bash

# Build without cache
docker compose --env-file .env -f docker-compose-e2e.yml build --no-cache

# Start containers in detached mode
docker compose --env-file .env -f docker-compose-e2e.yml up -d

# Show logs only for e2e-tests
docker compose --env-file .env -f docker-compose-e2e.yml logs -f e2e-tests

# Wait for tests to complete and capture the exit code
docker compose --env-file .env -f docker-compose-e2e.yml wait e2e-tests
EXIT_CODE=$?

# Stop all containers after tests complete
docker compose --env-file .env -f docker-compose-e2e.yml down

# Exit with the same code as the test container
exit $EXIT_CODE
