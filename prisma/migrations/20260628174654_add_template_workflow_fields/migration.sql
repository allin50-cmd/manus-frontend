CREATE TYPE "TemplateCategory" AS ENUM ('Compliance', 'Outreach', 'Operations', 'Finance', 'Legal', 'General');

ALTER TABLE "Template"
ADD COLUMN "category" "TemplateCategory" NOT NULL DEFAULT 'General',
ADD COLUMN "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "pendingReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approvedBy" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT;
