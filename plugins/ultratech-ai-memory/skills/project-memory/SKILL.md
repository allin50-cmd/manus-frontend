---
description: Use at the start of any task on this repo, or when asked about project state, past decisions, known issues, or "what's the memory on X". Reads and updates the deterministic markdown memory files in ai/ — plain file reads/edits, no AI/LLM calls, no external services.
---

# Project Memory (ai/*.md)

This repo keeps its working memory as plain markdown files under `ai/`, not as an AI/LLM feature. Treat these files as the project's persistent state — read them before acting, and update them after making a change that affects current state, decisions, or known issues.

## Read order (check these first)

1. `ai/00_READ_THIS_FIRST.md` — what the project is, canonical branch, before-you-code checklist
2. `ai/02_CURRENT_STATE.md` — what's done, in progress, blocked
3. `ai/08_DECISIONS.md` — past decisions and why, so you don't re-litigate them
4. `ai/10_KNOWN_ISSUES.md` — known bugs and schema blockers
5. `ai/03_ARCHITECTURE.md`, `ai/07_DATABASE.md`, `ai/06_ROUTES.md`, `ai/04_MODULES.md`, `ai/05_APIS.md` — as relevant to the area you're touching
6. `ai/17_UI_COMPONENT_LIBRARY.md` — before touching any UI, if the task involves new components or visual changes (see the `ui-reference-check` skill)

## Updating memory (deterministic — plain edits, not summarization)

After a change that alters current state, adds a decision, resolves or introduces a known issue, or ships a feature:

- Append a dated, one-line entry to `ai/13_CHANGELOG.md`
- Update the relevant section of `ai/02_CURRENT_STATE.md` (move an item from "in progress" to "done", add a new blocker, etc.)
- If a new architectural or product decision was made, add it to `ai/08_DECISIONS.md` with the reasoning
- If a bug or blocker was found, add it to `ai/10_KNOWN_ISSUES.md`; if fixed, remove or mark it resolved

Keep edits short and factual — this is a project log, not prose. Do not invent AI-generated summaries; only record what you actually observed or changed.

## Non-negotiable

- This skill never calls an external AI/LLM API. It only reads and edits local markdown files.
- Follow the hard rules already documented in `CLAUDE.md` and `AGENTS.md` at the repo root (no new paid infrastructure, no AI dependencies by default, stay on the approved stack) before making any change that touches architecture.
