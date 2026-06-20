-- Replace ManyChat fields with Twilio WhatsApp config
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "manychatApiKey";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "manychatPageId";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "manychatFlowBooking";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "manychatFlowBarber";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "manychatFlowReminder";
ALTER TABLE "TenantSettings" DROP COLUMN IF EXISTS "manychatFieldMap";

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "twilioAccountSid" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "twilioAuthToken" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "twilioWhatsappFrom" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "twilioContentSidBooking" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "twilioContentSidBarber" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "twilioContentSidReminder" TEXT;
