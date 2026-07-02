# ultratech-ai-memory

A Claude Code dev-tooling plugin for this repo. It does **not** call any AI/LLM API — "memory" here means the existing `ai/*.md` markdown files, read and maintained deterministically.

## What it does

- **SessionStart hook**: prints `ai/00_READ_THIS_FIRST.md`, `ai/02_CURRENT_STATE.md`, and `ai/10_KNOWN_ISSUES.md` into context at the start of a session, so an assistant always starts with current project state.
- **`project-memory` skill**: instructions for reading the full `ai/` memory set and how to update it (changelog, current state, decisions, known issues) after a change — plain file edits, not AI summarization.

## Enable it in this repo

```
/plugin marketplace add .
/plugin install ultratech-ai-memory@ultratech-os-tools
```

Or for local testing without installing:

```
claude --plugin-dir plugins/ultratech-ai-memory
```

## Why a plugin instead of app code

Per `CLAUDE.md`, this project is in a stabilisation phase: no new AI dependencies, no new infrastructure, no platform changes. This plugin is dev tooling only — it ships no runtime code, adds no dependency, and makes no network calls. It matches the "salvage" item already pre-approved in `CLAUDE.md` (local Claude dev hooks), formalized as a portable plugin.
