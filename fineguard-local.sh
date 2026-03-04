#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# fineguard-local.sh  –  Start FineGuard locally (API + UI)
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[fineguard]${NC} $*"; }
warn()  { echo -e "${YELLOW}[fineguard]${NC} $*"; }
error() { echo -e "${RED}[fineguard]${NC} $*" >&2; }

# ── Preflight checks ──────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install from https://nodejs.org"; exit 1
fi
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found – installing via corepack..."
  corepack enable && corepack prepare pnpm@latest --activate
fi

# ── .env setup ────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    warn ".env created from .env.example – please review and fill in secrets."
  else
    warn "No .env file found. Create one based on .env.example."
  fi
fi

# ── Install dependencies ──────────────────────────────────────────────────────
info "Installing dependencies..."
pnpm install --frozen-lockfile

# ── Kill any stale processes on our ports ─────────────────────────────────────
for PORT in 3000 5173; do
  if lsof -ti tcp:"$PORT" &>/dev/null; then
    warn "Port $PORT in use – stopping existing process..."
    lsof -ti tcp:"$PORT" | xargs kill -9 2>/dev/null || true
  fi
done

# ── Launch (API + Vite concurrently) ─────────────────────────────────────────
info "Starting FineGuard..."
echo ""
echo -e "  ${GREEN}UI ${NC} → http://localhost:5173"
echo -e "  ${GREEN}API${NC} → http://localhost:3000"
echo ""

# Use the built-in 'start' script which runs both via concurrently
exec pnpm start
