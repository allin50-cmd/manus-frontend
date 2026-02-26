#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install pnpm if not available
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi

# Install all dependencies (uses lockfile, leverages container cache)
pnpm install
