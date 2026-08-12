# UltraCore eve repository agent

This is an **isolated development tool** built with Vercel `eve`. It is not part of the UltraCore Ops product runtime and the root Next.js application does not depend on it.

It exists to inspect `allin50-cmd/manus-frontend`, coordinate specialist engineering reviews, inspect CI, and prepare review findings. It must not make customer-facing business decisions, send outreach, change production data, or act as a compliance decision-maker.

## Why it is isolated

The production app is pinned to Node 22. Current `eve` projects require Node 24, so this tool has its own package boundary under `tools/` and is intentionally absent from the root npm workspace and root `package-lock.json`.

## Local setup

Use Node 24 inside this directory:

```bash
cd tools/eve-repo-agent
node --version
npm install
npm run info
npm run dev
```

The first Node-24 install will create this tool's own `package-lock.json`. Review and commit that lockfile before treating an eve deployment as production-ready.

## Vercel Connect + GitHub

Link this directory to its own Vercel project, then create a GitHub connector scoped only to the repositories the agent should inspect:

```bash
vercel link
vercel env pull
vercel connect create github --name ultracore-eve
vercel connect attach github/ultracore-eve -e development -e preview
```

Select `allin50-cmd/manus-frontend` when GitHub asks which repositories the managed app may access.

`agent/tools/github.ts` uses the connector id `github/ultracore-eve` and the GitHub Tools `maintainer` preset. GitHub write tools remain human-approval gated by the integration defaults; the agent instructions additionally prohibit unapproved writes.

Do **not** attach production triggers or add an automatic GitHub mention channel until the agent has passed local/eval review. Deployment is intentionally a separate step:

```bash
npm run build
npm run deploy
```

## Specialists

The root eve agent can delegate focused analysis to:

- `architecture-guardian`
- `auth-security-reviewer`
- `compliance-workflow-reviewer`
- `data-api-guardian`
- `ui-accessibility-reviewer`
- `e2e-release-validator`

The root agent must pass the relevant diff/file/context to a specialist because declared eve subagents have isolated context.
