#!/usr/bin/env bash
set -e

PORT="${PORT:-8080}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Local Production Deploy ==="

# 1. Start PostgreSQL if not running
if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  echo "[1/4] Starting PostgreSQL..."
  pg_ctlcluster 16 main start 2>/dev/null || sudo pg_ctlcluster 16 main start
else
  echo "[1/4] PostgreSQL already running"
fi

# 2. Install dependencies (skip if node_modules exists)
if [ ! -d "node_modules" ]; then
  echo "[2/4] Installing dependencies..."
  npm install
else
  echo "[2/4] Dependencies already installed"
fi

# 3. Build frontend
echo "[3/4] Building frontend..."
npx vite build

# 4. Kill anything on target port, then start
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "     Stopping existing server on port $PORT..."
  kill "$(lsof -ti:"$PORT")" 2>/dev/null || true
  sleep 1
fi

echo "[4/4] Starting production server on port $PORT..."
echo ""
echo "  App:    http://localhost:$PORT"
echo "  Health: http://localhost:$PORT/api/health"
echo ""
NODE_ENV=production PORT="$PORT" exec npx tsx server/index.ts
