-- Subscription billing period end + renewal reminder tracking
ALTER TABLE "Tenant" ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "renewalReminderSentFor" TIMESTAMP(3);
