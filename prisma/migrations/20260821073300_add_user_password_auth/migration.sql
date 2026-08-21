-- Permanent auth-schema repair.
-- UserPassword exists in prisma/schema.prisma but had no recorded migration,
-- which can leave clean deployments unable to authenticate.

CREATE TABLE IF NOT EXISTS "UserPassword" (
    "person" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPassword_pkey" PRIMARY KEY ("person")
);
