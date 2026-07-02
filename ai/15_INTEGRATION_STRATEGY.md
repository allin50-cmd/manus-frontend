# Integration Strategy

Last updated: 2026-07-02

## Purpose

UltraTech OS should remain the user's daily operating layer. External tools are connectors behind the scenes, not separate user experiences.

This file records the agreed connector strategy so future implementation does not drift into one-off integrations or duplicated UI.

## Principle

One UI. One workflow engine. Multiple providers.

Users should interact with UltraTech OS concepts:

- Work items
- Tasks
- Decisions
- Comments
- Due dates
- Owners
- Status transitions
- Activity history

Connectors translate those concepts to external platforms.

## Provider categories

### 1. Native provider

- UltraTech OS local work items

This is the default source of truth and the baseline implementation.

### 2. Work providers

Work providers are external systems where tasks/issues already live.

Initial supported roadmap:

- GitHub Issues
- Jira
- Linear
- Microsoft Planner

These should use a shared Work Provider interface rather than bespoke UI flows.

### 3. Business connectors

Business connectors are operational context sources.

Initial supported roadmap:

- Google Workspace
  - Gmail
  - Google Calendar
  - Google Drive
  - Google Contacts
  - Google Docs
- Microsoft 365
  - Outlook
  - Microsoft Calendar
  - OneDrive
  - Teams
  - Microsoft Planner

Google Workspace is not optional for the long-term product direction. It is a core business ecosystem and should sit beside Microsoft 365.

## Keep it simple

Do not build all connectors at once.

Preferred order:

1. UltraTech OS native provider
2. GitHub Issues
3. Google Workspace context connector
4. Microsoft Planner / Microsoft 365
5. Jira
6. Linear

Reasoning:

- Native provider proves the workflow model.
- GitHub Issues is easiest to validate with the existing development workflow.
- Google Workspace is essential for real business context: email, calendar, documents, contacts.
- Microsoft Planner / Microsoft 365 covers many UK small businesses.
- Jira and Linear are useful but should not drive the product architecture.

## Shared Work Provider shape

Every provider should map into the smallest useful common model:

```ts
interface WorkProviderItem {
  externalId: string
  provider: 'native' | 'github' | 'jira' | 'linear' | 'microsoft-planner'
  title: string
  description?: string | null
  status: string
  priority?: string | null
  assignee?: string | null
  dueDate?: string | null
  labels?: string[]
  url?: string | null
  updatedAt?: string | null
}
```

Do not expose provider-specific complexity in the Today Workspace UI.

## Shared actions

Where supported, providers should implement:

- listProjects()
- listItems(projectId)
- createItem(input)
- updateStatus(itemId, status)
- assignItem(itemId, userId)
- addComment(itemId, body)
- syncDueDate(itemId, dueDate)
- getItemUrl(itemId)

Provider gaps should be handled gracefully. For example, if a provider has no real priority field, leave priority null rather than inventing one.

## Workflow mapping

The UltraTech workflow engine remains the internal rule layer.

Provider statuses map to UltraTech statuses:

- Captured
- Controlled
- InProgress
- Waiting
- FollowUpDue
- Escalated
- DecisionNeeded
- Completed
- Paused
- NotFit
- Archived

Never let an external provider silently bypass internal transition rules.

## Anti-drift rules

Do not:

- Build separate Jira, Linear, GitHub, and Planner dashboards.
- Put provider-specific business rules inside React components.
- Make Jira or Linear the system of truth for UltraTech OS.
- Add OAuth flows before the provider interface is stable.
- Add dependencies until a connector is actually being implemented.

Do:

- Keep connector code isolated.
- Add provider-specific mapping files.
- Audit every sync action.
- Fail safely when credentials are missing.
- Keep the UI provider-neutral.

## Future connector folders

Suggested future structure:

```txt
server/integrations/
  workProvider.ts
  native/
  github-issues/
  google-workspace/
  microsoft-planner/
  jira/
  linear/
```

Do not create these folders until implementation begins.

## Current status

This is strategy only. No connector runtime code exists yet.
