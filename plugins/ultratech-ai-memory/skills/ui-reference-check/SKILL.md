---
description: Use before writing or reviewing any new UI component or page in this repo, to check it against the documented visual reference and avoid an unscoped redesign. Deterministic file read only, no AI/LLM calls.
---

# UI reference check

`ai/17_UI_COMPONENT_LIBRARY.md` (with the source image at
`ai/assets/ultratech-os-component-library.png`) documents a component-library
mockup supplied for this project. It is a **reference for a possible future
direction**, not the current design system.

## Before building or reviewing UI

1. Read `ai/17_UI_COMPONENT_LIBRARY.md`.
2. Check what the current app actually looks like: the live design system is
   light-background Tailwind (`slate`/`blue`/`green`/`red`/`amber`/`purple`),
   implemented in `components/StatusBadge.tsx`, `components/NavBar.tsx`, and
   the existing `app/**` pages — not the dark neon-3D style in the mockup.
3. Unless the task explicitly asks to build toward the mockup's look, match
   the **existing, live design system**, not the reference image.
4. If a task says "no UI redesign" or similar, treat the mockup as
   background context only — do not restyle existing components to match it.
5. If asked to adopt part of the mockup (e.g. a badge style, a KPI tile
   layout), implement only what was asked, using the mapping table in
   `ai/17_UI_COMPONENT_LIBRARY.md` to find the nearest existing component to
   extend rather than creating a parallel one.

## Non-negotiable

- This skill never calls an external AI/LLM API. It only reads the local
  markdown doc and image.
- Broad visual/platform changes require explicit approval per `CLAUDE.md`
  ("no platform changes without approval") — this skill exists to prevent
  silently drifting toward the mockup during unrelated work.
