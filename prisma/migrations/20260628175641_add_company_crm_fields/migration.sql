ALTER TABLE "Company"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "companiesHouseNumber" TEXT,
ADD COLUMN "incorporationDate" TIMESTAMP(3),
ADD COLUMN "jurisdiction" TEXT;
