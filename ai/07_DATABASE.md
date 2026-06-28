# Database

## Technology

**Supabase** (PostgreSQL), accessed via Prisma ORM (primary) and Drizzle (schema defined, not yet active).

## ORM state

### Prisma (active)
- Schema: `prisma/schema.prisma`
- Client: `lib/db.ts` exports `db` — a lazy proxy that creates `PrismaClient` only on first access
- All existing routes use `db.model.findMany(...)` etc.
- `lib/types.ts` provides Prisma-independent enum types for routes

### Drizzle (planned)
- Schema: `db/schema.ts`
- Client: `lib/db.ts` exports `getDb()` — a lazy Drizzle client
- Not yet used in any production route
- Will be the migration target for new routes

## Existing Prisma models (canonical branch)

| Model | Purpose |
|---|---|
| `WorkItem` | Core obligation/lead/task entity |
| `Action` | Tasks assigned to team members |
| `ActivityLog` | Append-only audit trail |
| `Decision` | Approval requests for George |
| `Template` | Message templates |
| `AlertRecipient` | External alert recipients |
| `AlertDelivery` | Alert delivery records |
| `AlertEvent` | Alert delivery events |
| `UserPassword` | Auth (bcrypt hashed) |
| `VoiceIntake` | Audio upload → transcription → parsed draft |
| `Company` | Companies (name, contacts relation) |
| `Contact` | Contacts linked to companies |

## Schema changes needed (deferred — do NOT apply without a migration plan)

| Addition | Affects |
|---|---|
| `Filing` model + `FilingStatus`/`FilingCategory`/`FilingSource` enums | Filings feature |
| `OutreachLog` model + `OutreachChannel`/`OutreachDirection` enums | Partnerships, Outreach |
| `WorkItem.pipelineStage` (PipelineStage enum), `.dealValue`, `.companyId`, `.contactId` | Partnerships/CRM |
| `Action.reassignedFrom/At/By`, `.handoffNote` | My Tasks reassign, Action reassign |
| `Template.category` (TemplateCategory enum), `.variables`, `.pendingReview`, `.approvedBy`, `.approvedAt`, `.reviewNote` | Template workflow |
| `VoiceIntake.transcriptConfidence`, `.qualityFlags` | Voice quality signals |
| `Company.isActive`, `.companiesHouseNumber`, `.incorporationDate`, `.jurisdiction` | Companies CRM, Filings |

## Migration strategy

1. Extend `prisma/schema.prisma` with ONE feature group at a time
2. Run `prisma generate` in the local dev environment
3. Create a migration with `prisma migrate dev --name <description>`
4. Update `lib/types.ts` if new enum types are needed in routes
5. Update `db/schema.ts` (Drizzle) if the new table will eventually use Drizzle
6. Deploy migration via Vercel build command: `npx prisma generate && npx prisma migrate deploy && npm run build`

## DO NOT

- Do NOT run `prisma db push --accept-data-loss` in production (data loss risk)
- Do NOT apply multiple feature groups' schema changes in one migration
- Do NOT remove Prisma until ALL routes have been verified to work with Drizzle
