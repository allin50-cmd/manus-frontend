CREATE TYPE "PipelineStage" AS ENUM (
  'Prospect',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
  'Dormant'
);

ALTER TABLE "WorkItem"
ADD COLUMN "pipelineStage" "PipelineStage",
ADD COLUMN "lastTouchedAt" TIMESTAMP(3);

CREATE TABLE "OutreachLog" (
  "id" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "person" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OutreachLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OutreachLog"
ADD CONSTRAINT "OutreachLog_workItemId_fkey"
FOREIGN KEY ("workItemId")
REFERENCES "WorkItem"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
