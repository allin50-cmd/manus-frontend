---
name: react-code-fix-linter
description: Fixes safe formatting and lint issues in changed React, Next.js, JavaScript, and TypeScript files before commit, then verifies type-checks and tests. Use when lint or formatting fails, before committing frontend changes, or when CI reports style/type issues.
---

# React Code Fix & Linter

Use the repository's own configured tools. Do not add, upgrade, or download formatter/linter dependencies unless the user explicitly asks for that dependency change.

## Workflow

1. Read `package.json` and identify the package manager from the lockfile.
2. Inspect the working tree with `git status --short` and `git diff --check`.
3. Identify changed frontend files (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.json`, `.css`, `.md`, `.mdx`).
4. Apply only safe automatic formatting/fixes using tools already configured in the repository:
   - Prefer a project script such as `format`, `format:fix`, `prettier`, `lint:fix`, or `fix` when present.
   - Otherwise, if a local Prettier binary exists, run it only on changed supported files.
   - Otherwise, if a local ESLint binary exists, run ESLint with `--fix` only on changed JS/TS files.
   - If neither formatter nor linter is configured, do not fetch tools implicitly; report that gap.
5. Run the non-mutating lint/check command after any automatic fix when one exists.
6. Always run the repository's TypeScript check when available. In this project use `npm run type-check`.
7. Run the repository test suite when the change can affect behavior. In this project use `npm test`.
8. Finish with `git diff --check`, `git diff`, and `git status --short`.

## Guardrails

- Never weaken or disable lint, TypeScript, React Hooks, Next.js, test, or CI rules just to obtain a green result.
- Never add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, or equivalent suppressions unless the underlying issue is understood and the suppression is explicitly justified.
- Never reformat unrelated files.
- Never modify generated files unless the repository's normal tool regenerates them as part of the fix.
- Never commit or push automatically unless the user asked for it.
- Treat formatting/lint cleanup as non-authoritative: do not change application behavior unless a real defect requires a separate reviewed fix.

## Report

State which formatter/linter commands ran, which files changed, whether `type-check` and tests passed, and list any remaining manual issues.