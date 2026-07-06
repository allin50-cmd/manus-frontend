#!/bin/bash
set -e

# === CONFIGURATION (adjust these paths if needed) ===
MANUS_CONTENT_DIR="./manus_content"
ASSETS_SOURCE_DIR="./manus_assets"
ASSETS_TARGET_DIR="public/assets/icons"

echo "🚀 Starting migration from Manus to Claude Code..."

# Force-recreate the branch (deletes it if it exists)
git checkout -B migrate-manus-to-claude

# Create directories
mkdir -p .claude/skills docs/platform docs/prompts "$ASSETS_TARGET_DIR"

# Copy your Manus knowledge files (or create placeholders)
cp "$MANUS_CONTENT_DIR/CLAUDE.md" . 2>/dev/null || touch CLAUDE.md
cp "$MANUS_CONTENT_DIR/PLATFORM_CONSTITUTION.md" . 2>/dev/null || touch PLATFORM_CONSTITUTION.md
cp "$MANUS_CONTENT_DIR/PLATFORM_DECISIONS.md" . 2>/dev/null || touch PLATFORM_DECISIONS.md
cp "$MANUS_CONTENT_DIR/SKILL_ARCHITECTURE.md" . 2>/dev/null || touch SKILL_ARCHITECTURE.md

# Ensure CLAUDE.md has the required content (if it's empty)
if [ ! -s CLAUDE.md ]; then
  cat > CLAUDE.md << 'INNEREOF'
# Claude Code Instructions — UltraTech OS

Before making changes, read:

1. PLATFORM_CONSTITUTION.md
2. SKILL_ARCHITECTURE.md
3. docs/platform/
4. .claude/skills/

Rules:
- Keep changes surgical.
- Do not redesign approved UI.
- Reuse existing components.
- Reuse existing services.
- Mobile-first.
- Audit important actions.
- Preserve UltraTech OS architecture.
INNEREOF
fi

# Create skill folders and copy their SKILL.md files
SKILLS=(
  "ultratech-os-builder"
  "ultratech-ui-matching"
  "ultratech-engineering-bible"
  "ultratech-docs-portal"
  "ultratech-skill-factory"
  "ultracore-execution-guard"
)

for skill in "${SKILLS[@]}"; do
  mkdir -p ".claude/skills/$skill"
  if [ -f "$MANUS_CONTENT_DIR/skills/$skill/SKILL.md" ]; then
    cp "$MANUS_CONTENT_DIR/skills/$skill/SKILL.md" ".claude/skills/$skill/"
  else
    echo "# $skill\n\nPlaceholder - replace with actual Manus skill content." > ".claude/skills/$skill/SKILL.md"
  fi
done

# Copy assets if you have them in $ASSETS_SOURCE_DIR
if [ -d "$ASSETS_SOURCE_DIR" ]; then
  cp -r "$ASSETS_SOURCE_DIR"/* "$ASSETS_TARGET_DIR/"
fi

# Replace /manus-storage/ with /assets/icons/ in all code/markdown files
# macOS requires -i '' (empty string) for no backup
find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.js" -o -name "*.html" \) \
  -exec sed -i '' 's|/manus-storage/|/assets/icons/|g' {} \;

# Commit the changes
git add .
git commit -m "Migrate Manus project knowledge to Claude Code"

echo "✅ Migration complete. Now opening Claude Code..."
if command -v claude &> /dev/null; then
  claude
else
  echo "Claude Code not found. Run 'claude' manually when ready."
fi
