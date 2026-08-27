# UltraCore Eve repository agent

This is an **isolated development tool** built with Vercel `eve`. It is not part of the UltraCore Ops product runtime, and the root Next.js application does not depend on it.

It exists to inspect `allin50-cmd/manus-frontend`, coordinate specialist engineering reviews, inspect repository evidence, and prepare review findings. It must not make customer-facing business decisions, send outreach, change production data, or act as a compliance decision-maker.

## Why it is isolated

The production app is pinned to Node 22. Eve requires Node 24, so this tool has its own package boundary under `tools/` and is intentionally absent from the root npm workspace and root `package-lock.json`.

## GitHub integration

The initial GitHub capability is deliberately **read-only**. Six static Eve tools are registered under `agent/tools/`:

- repository metadata
- file content
- pull-request context
- issue context
- pull-request listing
- issue listing

They use the supported `@github-tools/sdk/eve` individual tool factories. The newer mountable `@github-tools/eve-extension` remains the preferred long-term integration, but with Eve 0.33.2 its dynamic registration path currently fails `eve build` in this repository with a generated `__eve_dynamic_exec_*` redeclaration error inside Eve's `connection-search-dynamic.js`. The static compatibility bridge keeps the agent build-gated and removes all GitHub write capabilities from this first release.

No GitHub credential is embedded. The tool layer reads `GITHUB_TOKEN` at runtime.

## Local setup

Use Node 24 inside this directory:

```bash
cd tools/eve-repo-agent
node --version
npm install
npm run info
npm run build
```

To run the agent against GitHub, provide a narrowly scoped read-only development token at runtime:

```bash
export GITHUB_TOKEN=...
npm run dev
```

Do not commit that token. Prefer a GitHub App or another short-lived/narrowly scoped credential before any production deployment.

## Vercel deployment boundary

Deployment is intentionally separate from this repository scaffold. Link this directory to its own Vercel project and configure the runtime credential only after the build/review gate is green.

Do **not** attach production triggers or an automatic GitHub mention/channel in this PR. A later reviewed change can migrate the GitHub integration to the current Eve extension once the upstream dynamic-tool build path is proven green.

## Specialists

The root Eve agent can delegate focused analysis to:

- `architecture-guardian`
- `auth-security-reviewer`
- `compliance-workflow-reviewer`
- `data-api-guardian`
- `ui-accessibility-reviewer`
- `e2e-release-validator`

Declared Eve subagents have isolated context. The root agent must pass the relevant diff, files, and evidence when delegating.
