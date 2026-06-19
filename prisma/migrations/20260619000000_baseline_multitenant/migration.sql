-- Baseline multitenant schema
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customDomain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantSettings" (
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 40,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 1,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "cancelNoticeHours" INTEGER NOT NULL DEFAULT 2,
    "scheduleJson" JSONB,
    "manychatApiKey" TEXT,
    "manychatPageId" TEXT,
    "manychatFlowBooking" TEXT,
    "manychatFlowBarber" TEXT,
    "manychatFlowReminder" TEXT,
    "manychatFieldMap" JSONB,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("tenantId")
);

CREATE TABLE "TenantOnboarding" (
    "tenantId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionNote" TEXT,

    CONSTRAINT "TenantOnboarding_pkey" PRIMARY KEY ("tenantId")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "photo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'barbero',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlockedSlot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isFullDay" BOOLEAN NOT NULL DEFAULT false,
    "time" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedSlot_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");
CREATE UNIQUE INDEX "User_tenantId_username_key" ON "User"("tenantId", "username");
CREATE UNIQUE INDEX "BlockedSlot_barberId_date_time_key" ON "BlockedSlot"("barberId", "date", "time");

-- Indexes
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Booking_tenantId_barberId_dateTime_idx" ON "Booking"("tenantId", "barberId", "dateTime");
CREATE INDEX "Booking_barberId_dateTime_idx" ON "Booking"("barberId", "dateTime");
CREATE INDEX "Booking_dateTime_idx" ON "Booking"("dateTime");
CREATE INDEX "Booking_reminderSentAt_dateTime_idx" ON "Booking"("reminderSentAt", "dateTime");
CREATE INDEX "Booking_tenantId_idx" ON "Booking"("tenantId");
CREATE INDEX "BlockedSlot_tenantId_barberId_date_idx" ON "BlockedSlot"("tenantId", "barberId", "date");
CREATE INDEX "BlockedSlot_barberId_date_idx" ON "BlockedSlot"("barberId", "date");

-- Foreign keys
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantOnboarding" ADD CONSTRAINT "TenantOnboarding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
