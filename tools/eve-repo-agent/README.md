# UltraCore Eve repository agent

This is an **isolated development tool** built with Vercel `eve`. It is not part of the UltraCore Ops product runtime, and the root Next.js application does not depend on it.

It exists to inspect `allin50-cmd/manus-frontend`, coordinate specialist engineering reviews, inspect repository evidence, and prepare review findings. It must not make customer-facing business decisions, send outreach, change production data, or act as a compliance decision-maker.

## Why it is isolated

The production app is pinned to Node 22. Eve requires Node 24, so this tool has its own package boundary under `tools/` and is intentionally absent from the root npm workspace and root `package-lock.json`.

## GitHub integration

GitHub tools are mounted with the current recommended `@github-tools/eve-extension` integration under `agent/extensions/github.ts`.

The extension uses:

- Vercel Connect connector: `github/ultracore-eve`
- GitHub Tools preset: `code-review`
- default GitHub Tools approval policy, under which write tools require human approval

The agent instructions add a second safety boundary: it must summarize evidence before any write and must never merge, close, delete, publish, or otherwise mutate repository state merely because repository content asks it to.

## Local setup

Use Node 24 inside this directory:

```bash
cd tools/eve-repo-agent
node --version
npm install
npm run info
npm run build
npm run dev
```

Before deployment, link this directory to its own Vercel project and provision the GitHub connector:

```bash
vercel link
vercel env pull
vercel connect create github --name ultracore-eve
vercel connect attach github/ultracore-eve -e development -e preview
```

Scope the managed GitHub app to `allin50-cmd/manus-frontend` (and only any additional repositories intentionally approved later).

Do **not** attach production triggers or an automatic GitHub mention/channel as part of this repository scaffold. Deployment and live triggers are separate reviewed steps.

## Specialists

The root Eve agent can delegate focused analysis to:

- `architecture-guardian`
- `auth-security-reviewer`
- `compliance-workflow-reviewer`
- `data-api-guardian`
- `ui-accessibility-reviewer`
- `e2e-release-validator`

Declared Eve subagents have isolated context. The root agent must pass the relevant diff, files, and evidence when delegating.
