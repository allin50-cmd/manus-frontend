# Connector Planning Skill

Use this skill when planning Jira, Linear, GitHub Issues, Microsoft Planner, Google Workspace, or Microsoft 365 integrations for UltraTech OS.

## Operating rule

Keep connectors simple. Do not introduce runtime code, dependencies, OAuth, schema changes, or UI changes unless the user explicitly asks for implementation.

## Required reading

Before proposing connector work, read:

- `ai/15_INTEGRATION_STRATEGY.md`
- `ai/16_CONNECTOR_ROADMAP.md`
- `ai/08_DECISIONS.md`
- `ai/10_KNOWN_ISSUES.md`

## Recommended response shape

When asked to add or plan a connector, respond with:

1. What provider category it belongs to:
   - Work provider
   - Business connector
   - Context connector
2. The smallest useful first version.
3. What not to build yet.
4. Files likely to change.
5. Risks.
6. Acceptance criteria.

## Provider categories

### Work providers

These expose tasks/issues/work items:

- Native UltraTech OS
- GitHub Issues
- Jira
- Linear
- Microsoft Planner

### Business connectors

These expose business context:

- Google Workspace
- Microsoft 365
- Slack
- Dropbox

Google Workspace is a priority business connector and should not be omitted from the roadmap.

## First-version bias

Prefer manual linking before automatic sync.

Good first versions:

- Import selected GitHub issue into a local WorkItem.
- Link a Gmail message to a WorkItem.
- Attach a Google Drive file link to a WorkItem.
- Show today's Google Calendar meetings in Today context.
- Import selected Microsoft Planner tasks.

Avoid first versions that:

- Crawl every email.
- Auto-sync every external task.
- Write to external systems without confirmation.
- Add separate dashboards per provider.
- Add background workers before manual workflows are stable.

## Work provider interface sketch

```ts
interface WorkProvider {
  id: string
  label: string
  listProjects(): Promise<ProjectRef[]>
  listItems(projectId: string): Promise<WorkProviderItem[]>
  createItem(input: CreateProviderItemInput): Promise<WorkProviderItem>
  updateStatus(externalId: string, status: string): Promise<WorkProviderItem>
  addComment(externalId: string, body: string): Promise<void>
}
```

Do not implement this interface until asked. Use it as planning language only.

## Anti-drift checklist

Before approving a connector plan, check:

- Does it preserve the existing Prisma + JWT runtime stack?
- Does it avoid Supabase-client/RPC assumptions?
- Does it keep Today Workspace provider-neutral?
- Does it avoid new dependencies unless necessary?
- Does it leave type-check/build/tests as required gates?
- Does it update `ai/15_INTEGRATION_STRATEGY.md` or `ai/16_CONNECTOR_ROADMAP.md` if the roadmap changes?

## Output style

Use concise, practical implementation prompts. Do not produce large architecture documents unless requested.
