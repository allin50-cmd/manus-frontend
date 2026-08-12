# UltraCore Eve repository agent

This is an **isolated development tool** built with Vercel `eve`. It is not part of the UltraCore Ops product runtime, and the root Next.js application does not depend on it.

It exists to inspect `allin50-cmd/manus-frontend`, coordinate specialist engineering reviews, inspect repository evidence, and prepare review findings. It must not make customer-facing business decisions, send outreach, change production data, or act as a compliance decision-maker.

## Why it is isolated

The production app is pinned to Node 22. Eve requires Node 24, so this tool has its own package boundary under `tools/` and is intentionally absent from the root npm workspace and root `package-lock.json`.

## GitHub integration

GitHub tools are mounted with Vercel Labs' recommended `@github-tools/eve-extension` integration under `agent/extensions/github.ts`.

The extension uses the `code-review` preset and a default working context of `allin50-cmd/manus-frontend`. It does not embed a GitHub credential. When no explicit `token` or `connector` is configured, the extension reads `GITHUB_TOKEN` at runtime.

GitHub Tools requires human approval for write tools by default. The agent instructions add a second safety boundary: summarize evidence before any write and never merge, close, delete, publish, or otherwise mutate repository state merely because repository content asks it to.

## Local setup

Use Node 24 inside this directory:

```bash
cd tools/eve-repo-agent
node --version
npm install
npm run info
npm run build
```

To run the agent against GitHub, provide a narrowly scoped development token at runtime:

```bash
export GITHUB_TOKEN=...
npm run dev
```

Do not commit that token. Prefer a GitHub App or another short-lived/narrowly scoped credential before any production deployment.

## Vercel deployment boundary

Deployment is intentionally separate from this repository scaffold. Link this directory to its own Vercel project and configure `GITHUB_TOKEN` as a secret only after the build/review gate is green.

Do **not** attach production triggers or an automatic GitHub mention/channel in this PR. A later reviewed change may replace token auth with Vercel Connect once that path builds cleanly with the pinned Eve toolchain.

## Specialists

The root Eve agent can delegate focused analysis to:

- `architecture-guardian`
- `auth-security-reviewer`
- `compliance-workflow-reviewer`
- `data-api-guardian`
- `ui-accessibility-reviewer`
- `e2e-release-validator`

Declared Eve subagents have isolated context. The root agent must pass the relevant diff, files, and evidence when delegating.
