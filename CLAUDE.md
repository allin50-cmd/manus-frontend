# Claude Code Instructions — UltraTech OS

Before making changes, read:

1. PLATFORM_CONSTITUTION.md
2. SKILL_ARCHITECTURE.md
3. docs/platform/
4. .claude/skills/
5. .claude/agents/

Rules:
- Keep changes surgical.
- Do not redesign approved UI.
- Reuse existing components.
- Reuse existing services.
- Mobile-first.
- Audit important actions.
- Preserve UltraTech OS architecture.
- Project subagents in `.claude/agents/` are development-time reviewers, not product features.
- Vercel `eve` under `tools/eve-repo-agent/` is isolated repository tooling only; never import it into `app/`, `lib/`, `server/`, middleware, or the production Next.js runtime.
