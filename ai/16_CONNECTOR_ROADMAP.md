# Connector Roadmap

Last updated: 2026-07-02

## Goal

Build connectors slowly and safely. UltraTech OS should feel simple even when many external systems are connected.

## Phase 0 — No new runtime code

Status: current.

This phase is documentation and Claude Code skill support only.

Allowed:

- Markdown memory files
- Claude Code skills
- Provider interface design notes
- Test plans

Not allowed:

- OAuth implementation
- API clients
- New dependencies
- Database schema changes
- UI redesign

## Phase 1 — Native provider baseline

Use the existing WorkItem model and workflow engine as the reference behaviour.

Acceptance:

- Today Workspace works.
- Start Job and Complete Job work.
- Activity logging works.
- Workflow rules are server-side.
- D09 direct-write debt remains tracked.

## Phase 2 — GitHub Issues connector

Why first:

- Existing GitHub workflow is already used.
- Issues map cleanly to work items.
- Good for internal technical work.

Minimal scope:

- List issues from selected repos.
- Create local shadow work items from issues.
- Link local WorkItem to GitHub issue URL.
- Push comments back to GitHub issue only after explicit user action.

Do not implement full two-way sync first.

## Phase 3 — Google Workspace context connector

Why early:

Google is essential for real business operations.

Minimal scope:

- Gmail: create work item from email metadata and link back to source message.
- Calendar: show upcoming meetings in Today Workspace context.
- Drive: link documents to work items.
- Contacts: resolve people/company context.

Do not sync all Gmail. Do not crawl Drive. Use explicit user-selected items first.

## Phase 4 — Microsoft Planner / Microsoft 365

Why next:

Many UK small businesses use Microsoft 365. Planner is the Microsoft-native task layer.

Minimal scope:

- Import selected Planner plan tasks.
- Link Outlook/Teams context later.
- Map Planner buckets/statuses to UltraTech statuses conservatively.

## Phase 5 — Jira

Why later:

Jira is powerful but complex. It should not shape the UltraTech OS abstraction.

Minimal scope:

- List projects.
- List issues.
- Map status category to UltraTech status.
- Link local work items to Jira issues.

Avoid custom workflow support in the first version.

## Phase 6 — Linear

Why later:

Linear is clean and modern, but less important for non-technical operators than Google/Microsoft.

Minimal scope:

- Teams
- Issues
- Cycles if useful
- Labels
- Status mapping

## Connector implementation rules

Each connector should answer:

1. What external object maps to a WorkItem?
2. What external status maps to UltraTech status?
3. What can be safely read?
4. What can be safely written?
5. What must be user-confirmed?
6. What is the rollback/failure behaviour?
7. Where is the audit record written?

## Suggested files per connector, when implementation starts

```txt
server/integrations/<provider>/
  client.ts
  mapper.ts
  provider.ts
  types.ts
  README.md
```

Keep provider files small.

## First connector acceptance checklist

- No new UI dashboard.
- No background sync.
- No implicit writes.
- All external writes require user action.
- Missing credentials fail safely.
- All sync actions create activity logs.
- Type-check/build/tests pass.

## Explicit non-goals

- Becoming a Jira clone.
- Becoming a Linear clone.
- Replacing Gmail/Outlook.
- Full enterprise integration platform.
- Automated two-way sync before manual linking is proven.
