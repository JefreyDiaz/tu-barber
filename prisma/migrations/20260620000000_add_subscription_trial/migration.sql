-- Add subscription trial fields to Tenant
ALTER TABLE "Tenant" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
