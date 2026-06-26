-- Tenant public site branding
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "backgroundUrl" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;
