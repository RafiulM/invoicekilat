#!/bin/sh
# Container entrypoint: bring the DB up to date, seed, then start the server.
# Runs at container START (a live DATABASE_URL is required) — not at build time.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  node dist-scripts/migrate.cjs
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  node dist-scripts/seed.cjs
fi

echo "[entrypoint] Starting server..."
exec "$@"
