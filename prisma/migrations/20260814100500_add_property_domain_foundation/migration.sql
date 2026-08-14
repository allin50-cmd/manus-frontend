-- Property domain foundation for the LA workspace.
-- Additive only. No existing canonical tables are replaced or renamed.

CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "tenantId" UUID NOT NULL,
  "sourceSystem" TEXT,
  "sourceId" TEXT,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT,
  "postcode" TEXT NOT NULL,
  "propertyType" TEXT,
  "bedrooms" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Property_sourceSystem_sourceId_key" ON "Property"("sourceSystem", "sourceId");
CREATE INDEX "Property_tenantId_postcode_idx" ON "Property"("tenantId", "postcode");

CREATE TABLE "Tenancy" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceSystem" TEXT,
  "sourceId" TEXT,
  "tenantName" TEXT,
  "tenantEmail" TEXT,
  "tenantPhone" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "monthlyRentPence" INTEGER,
  "depositPence" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenancy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Tenancy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Tenancy_sourceSystem_sourceId_key" ON "Tenancy"("sourceSystem", "sourceId");
CREATE INDEX "Tenancy_propertyId_status_idx" ON "Tenancy"("propertyId", "status");

CREATE TABLE "PropertyCertificate" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceSystem" TEXT,
  "sourceId" TEXT,
  "certificateType" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Valid',
  "documentUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyCertificate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PropertyCertificate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PropertyCertificate_sourceSystem_sourceId_key" ON "PropertyCertificate"("sourceSystem", "sourceId");
CREATE INDEX "PropertyCertificate_propertyId_expiresAt_idx" ON "PropertyCertificate"("propertyId", "expiresAt");

CREATE TABLE "MaintenanceJob" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceSystem" TEXT,
  "sourceId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'Medium',
  "status" TEXT NOT NULL DEFAULT 'Open',
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "assignedTo" TEXT,
  "tenantNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceJob_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MaintenanceJob_sourceSystem_sourceId_key" ON "MaintenanceJob"("sourceSystem", "sourceId");
CREATE INDEX "MaintenanceJob_propertyId_status_idx" ON "MaintenanceJob"("propertyId", "status");
CREATE INDEX "MaintenanceJob_dueAt_status_idx" ON "MaintenanceJob"("dueAt", "status");
