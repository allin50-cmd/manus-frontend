# Google Workspace Context Skill

Use this skill when planning or reviewing Google Workspace integration for UltraTech OS.

## Purpose

Google Workspace is a core business connector, not an optional afterthought.

It should provide operational context around work items:

- Gmail messages
- Google Calendar events
- Google Drive files
- Google Contacts
- Google Docs links

## Scope rule

Start with explicit user-selected context. Do not crawl or sync everything.

## Smallest useful first version

1. Gmail message to WorkItem
   - User selects or forwards a message.
   - UltraTech OS creates or links a WorkItem.
   - Store message metadata and source URL if available.
   - Do not store full email body unless explicitly needed.

2. Google Calendar in Today Workspace
   - Show today's next meetings.
   - Link meeting context to work items manually.
   - Do not auto-create tasks from every meeting.

3. Google Drive document links
   - Attach selected Drive file URLs to work items.
   - Store title, URL, MIME type, and last known modified time if available.
   - Do not mirror file contents.

4. Google Contacts lookup
   - Resolve person/company context for work items.
   - Do not overwrite local contacts automatically.

## Privacy/safety rules

Do not propose broad Gmail/Drive crawling.
Do not store unnecessary email bodies.
Do not create background sync until manual linking works.
Do not write to Gmail, Calendar, Drive, or Contacts without explicit user action.

## Recommended planning output

When asked for Google integration, produce:

- First workflow to build
- Minimal data model or mapping
- API routes likely needed
- Auth/OAuth concern
- Privacy risk
- Acceptance tests
- What is deliberately not included

## Good first prompt

```text
Plan Google Workspace context connector for UltraTech OS.

Do not implement OAuth yet.
Do not add dependencies.
Do not change schema.

Define the smallest manual-linking workflow for:
- Gmail message to WorkItem
- Calendar meeting context in Today Workspace
- Drive file link on WorkItem
- Contact lookup

Output:
- proposed file structure
- data mapping
- API route outline
- privacy notes
- acceptance criteria
```

## Anti-drift note

Google Workspace should sit beside Microsoft 365 as a business ecosystem connector. It should not be treated as a work provider like Jira or Linear.
