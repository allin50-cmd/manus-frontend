#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install node dependencies (postinstall also runs prisma generate)
npm install

# Start Postgres if not already running
if ! pg_isready -q 2>/dev/null; then
  pg_ctlcluster 16 main start || true
  # Wait up to 10s for Postgres to be ready
  for i in $(seq 1 10); do
    pg_isready -q && break
    sleep 1
  done
fi

# Push schema and regenerate client against local DB
DATABASE_URL="postgresql://sheetops_demo:demo1234@localhost:5432/sheetops_demo" \
  npx prisma db push --skip-generate 2>/dev/null || true

npx prisma generate
