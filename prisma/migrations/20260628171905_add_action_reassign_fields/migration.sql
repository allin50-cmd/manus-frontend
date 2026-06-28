ALTER TABLE "Action"
ADD COLUMN "reassignedFrom" TEXT,
ADD COLUMN "reassignedAt" TIMESTAMP(3),
ADD COLUMN "reassignedBy" TEXT,
ADD COLUMN "handoffNote" TEXT;
