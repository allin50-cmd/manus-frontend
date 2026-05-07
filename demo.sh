#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════╗"
echo "║   VaultLine Brand Suite  —  Demo     ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Copy demo env ──────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.demo .env
  echo -e "${GREEN}✔ Created .env from .env.demo${NC}"
else
  echo -e "${YELLOW}⚠ .env already exists — using existing file${NC}"
fi

# ── 2. Start PostgreSQL ───────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶ Starting PostgreSQL…${NC}"
docker compose up -d postgres

echo -n "  Waiting for database"
until docker compose exec -T postgres pg_isready -U vaultline -d vaultline_demo -q 2>/dev/null; do
  echo -n "."
  sleep 1
done
echo -e " ${GREEN}ready${NC}"

# ── 3. Install deps (if needed) ───────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo ""
  echo -e "${CYAN}▶ Installing dependencies…${NC}"
  npm ci
fi

# ── 4. Run migrations ─────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶ Running database migrations…${NC}"
npm run db:migrate

# ── 5. Build frontend ─────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶ Building frontend…${NC}"
npm run build

# ── 6. Launch ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Demo running at http://localhost:3000   ${NC}"
echo -e "${GREEN}  Admin token: demo-admin-token           ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo "  Pages:"
echo "    /               → FineGuard landing"
echo "    /vaultline      → VaultLine Cloud landing"
echo "    /ultai          → UltAi Intake landing"
echo "    /compliance-bundle → FineGuard company lookup"
echo "    /intake         → UltAi intake form"
echo "    /book-demo      → Book a demo form"
echo "    /pricing        → Pricing"
echo "    /admin          → Admin panel (token: demo-admin-token)"
echo ""
echo "  Ctrl+C to stop."
echo ""

npm start
