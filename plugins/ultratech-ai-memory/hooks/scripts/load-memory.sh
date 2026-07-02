#!/bin/bash
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MEMORY_FILES=(
  "ai/00_READ_THIS_FIRST.md"
  "ai/02_CURRENT_STATE.md"
  "ai/10_KNOWN_ISSUES.md"
)

echo "## Project memory (deterministic markdown, no AI calls)"
echo

for f in "${MEMORY_FILES[@]}"; do
  path="$PROJECT_DIR/$f"
  if [ -f "$path" ]; then
    echo "### $f"
    cat "$path"
    echo
  fi
done

exit 0
