---
name: react-code-fix-linter
description: Fixes safe formatting and lint issues in changed React, Next.js, JavaScript, and TypeScript files before commit, then verifies type-checks and tests. Use when lint or formatting fails, before committing frontend changes, or when CI reports style/type issues.
---

# React Code Fix & Linter

Use the repository's configured tooling. The project pins its lint/fix CLI in `package.json`; do not change that version or add dependencies unless the user explicitly asks for a tooling change.

## Workflow

1. Read `package.json` and identify the package manager from the lockfile.
2. Inspect the working tree with `git status --short` and `git diff --check`.
3. Identify changed frontend files (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.json`, `.css`, `.md`, `.mdx`).
4. Run the configured safe fixer with `npm run lint:fix` when cleanup is requested.
5. Review the resulting diff and revert unrelated formatter churn; never reformat unrelated files just because the fixer can see them.
6. Run the non-mutating gate with `npm run lint`.
7. Always run `npm run type-check`.
8. Run `npm test` when the change can affect behavior.
9. Run `npm run build` when the change affects Next.js compilation, routing, server/client boundaries, or deployment behavior.
10. Finish with `git diff --check`, `git diff`, and `git status --short`.

## Guardrails

- Never weaken or disable lint, TypeScript, React Hooks, Next.js, test, or CI rules just to obtain a green result.
- Never add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, or equivalent suppressions unless the underlying issue is understood and the suppression is explicitly justified.
- Never reformat unrelated files.
- Never modify generated files unless the repository's normal tool regenerates them as part of the fix.
- Never change the pinned lint tool version as part of an application-code fix.
- Never commit or push automatically unless the user asked for it.
- Treat formatting/lint cleanup as non-authoritative: do not change application behavior unless a real defect requires a separate reviewed fix.

## Report

State which lint/fix commands ran, which files changed, whether `type-check`, tests, and build passed, and list any remaining manual issues.
