# React Code Fix & Linter

## Purpose

Repair React/TypeScript defects in this repository and validate the smallest safe change before commit. This skill is intentionally repository-native: it uses the checks and architecture already defined by UltraTech OS and does not install or assume third-party formatting/lint packages that are not present in `package.json`.

Use this skill for React component fixes, TypeScript errors, broken imports, hook misuse, server/client boundary mistakes, accessibility defects, build failures, and focused cleanup of code changed in the current task.

## Required context

Before changing user-facing React code, read and obey:

1. `CLAUDE.md`
2. `PLATFORM_CONSTITUTION.md`
3. `AGENTS.md`
4. `SKILL_ARCHITECTURE.md`
5. relevant files under `docs/platform/` and `ai/` when the task touches architecture or product behaviour

Hard repository rules always override this skill. In particular:

- keep changes surgical;
- do not redesign approved UI unless explicitly requested;
- reuse existing components and services;
- preserve mobile-first behaviour;
- do not expose internal agent/workflow/API/database terminology in user-facing copy;
- do not add Edge runtime to Prisma-backed routes;
- do not add new agent frameworks, tRPC, a monorepo, or another database;
- do not change Prisma schema unless the task actually requires it.

## Inputs

Provide as much of the following as is available:

- failing file(s), component(s), route(s), or test(s);
- TypeScript/build/test error output;
- intended user-visible behaviour;
- current branch or PR scope;
- constraints on files that must not change.

If the failure is reproducible from repository checks, reproduce it before editing.

## Outputs

The skill should leave:

- the smallest code change that fixes the confirmed defect;
- no unrelated refactor or visual redesign;
- no new dependency unless explicitly approved;
- relevant regression coverage when the defect is behavioural;
- successful repository validation, or a precise report of the remaining blocker.

## Workflow

### 1. Establish scope

Inspect the changed files and the failing surface before editing. Do not use broad search-and-replace when a focused change is possible.

For React work, identify whether each file is a Server Component or Client Component. Add `'use client'` only when browser-only APIs, hooks, or interactive state actually require it. Do not move server-only secrets or database code into client bundles.

### 2. Reproduce first

Run the narrowest useful check first, then the full repository gates after the fix.

Repository validation commands:

```bash
npm run type-check
npm test
npm run build
```

`npm run type-check:server` may also be run; in the current repository it is an informational compatibility script because all routes use Next.js App Router.

If a `lint` or `format` script is added to `package.json` in the future, use it. Until then, do **not** silently install ESLint, Prettier, Biome, or another formatter just to satisfy this skill.

### 3. Fix React/TypeScript defects

Check the changed code for the following classes of defects.

#### Type safety

- incorrect prop types;
- unsafe `any` introduced without need;
- nullable values dereferenced without guards;
- invalid enum/string literals;
- stale or missing imports/exports;
- mismatched async return types;
- React event types that do not match the element used.

Prefer correcting the source type or control flow over using casts to silence TypeScript.

#### React correctness

- hooks called conditionally or outside React components/hooks;
- missing hook dependencies that create stale behaviour;
- state derived unnecessarily from props;
- unstable or duplicate list keys;
- effects used for work that belongs in render/event handlers/server code;
- mutation of props or shared state;
- client components importing server-only modules;
- server components using browser APIs or interactive hooks.

#### Next.js boundaries

- preserve App Router conventions;
- keep Prisma and secrets server-side;
- avoid unnecessary `'use client'` boundaries;
- do not import Node-only modules into client code;
- preserve route-level auth requirements from `AGENTS.md`;
- do not change caching/rendering semantics as an incidental cleanup.

#### Accessibility and UI integrity

For changed interactive elements, verify:

- buttons use buttons for actions and links use links for navigation;
- controls have accessible names;
- form fields have associated labels where appropriate;
- keyboard interaction is not broken;
- images have appropriate alternative text;
- loading, empty, error, and disabled states remain understandable;
- mobile layout and existing design language are preserved.

Do not redesign untouched surfaces while fixing accessibility.

#### Code hygiene

Remove only code made obsolete by the fix:

- unused imports;
- unreachable branches;
- duplicate local helpers;
- temporary debugging output;
- commented-out replacement implementations.

Preserve existing formatting style. Avoid whole-file reformatting when the task changes only a few lines.

### 4. Add or update regression coverage

When fixing behaviour rather than a pure type/build error, add the smallest test that would have failed before the fix and passes afterward.

Do not rewrite broad test suites to accommodate an implementation change when the existing expected behaviour is still correct.

### 5. Validate in escalation order

After editing, run:

```bash
npm run type-check
npm test
npm run build
```

If one fails, fix the first confirmed error and rerun from that point. Do not suppress failures with `|| true`, `@ts-ignore`, disabled tests, weakened assertions, or broad type casts unless the task explicitly requires and justifies them.

For changes touching Prisma schema, follow `AGENTS.md` and run the approved schema workflow separately. Do not run database mutation commands for ordinary React fixes.

### 6. Review the diff

Before commit, verify:

- only intended files changed;
- no secrets or generated local files are included;
- no dependency or lockfile change occurred unless approved;
- user-facing wording respects the product vocabulary rules;
- no approved UI was redesigned accidentally;
- the fix is understandable without a large unrelated refactor.

## Stop conditions

Stop and report instead of guessing when:

- the requested fix conflicts with `AGENTS.md`, `CLAUDE.md`, or the platform constitution;
- the defect requires a database/schema change that was not in scope;
- a new package is required and has not been approved;
- tests depend on unavailable credentials or external services;
- the requested visual change would constitute a redesign rather than a repair.

## Example prompts

- `Use React Code Fix & Linter on the TypeScript errors in this component and keep the diff surgical.`
- `Fix this broken client component, add the smallest regression test, then run the React validation gates.`
- `Review the React files changed on this branch for hooks, client/server boundary, accessibility, and type errors.`
- `Run React Code Fix & Linter before commit; do not install new dependencies.`
