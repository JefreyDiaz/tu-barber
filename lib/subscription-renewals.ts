import { prisma } from '@/lib/prisma';
import { isPeriodEndingTomorrow } from '@/lib/dates/timezone';
import { notifySubscriptionExpiringAdmin } from '@/lib/email/notify-subscription-expiring-admin';
import { sendSubscriptionRenewalReminder } from '@/lib/messaging/subscription-renewal';
import { getSubscriptionPeriodEnd } from '@/lib/tenant/subscription';

const REMINDABLE_STATUSES = ['trialing', 'active', 'past_due'] as const;

export async function processSubscriptionRenewalReminders(now: Date = new Date()): Promise<{
  scanned: number;
  sent: number;
  failed: number;
}> {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'active',
      subscriptionStatus: { in: [...REMINDABLE_STATUSES] },
    },
    include: { onboarding: true },
  });

  let sent = 0;
  let failed = 0;
  let scanned = 0;

  for (const tenant of tenants) {
    const periodEnd = getSubscriptionPeriodEnd(tenant);
    if (!periodEnd || !tenant.onboarding) continue;

    if (!isPeriodEndingTomorrow(periodEnd, now, tenant.timezone)) continue;

    scanned += 1;

    if (
      tenant.renewalReminderSentFor &&
      tenant.renewalReminderSentFor.getTime() === periodEnd.getTime()
    ) {
      continue;
    }

    const payload = {
      shopName: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      ownerName: tenant.onboarding.ownerName,
      ownerEmail: tenant.onboarding.ownerEmail,
      ownerPhone: tenant.onboarding.ownerPhone,
      periodEnd,
      timezone: tenant.timezone,
      subscriptionStatus: tenant.subscriptionStatus,
    };

    const [adminOk, tenantOk] = await Promise.all([
      notifySubscriptionExpiringAdmin(payload),
      sendSubscriptionRenewalReminder({
        ownerPhone: tenant.onboarding.ownerPhone,
        ownerName: tenant.onboarding.ownerName,
        shopName: tenant.name,
        planId: tenant.plan,
        periodEnd,
        timezone: tenant.timezone,
        subscriptionStatus: tenant.subscriptionStatus,
      }),
    ]);

    if (adminOk && tenantOk) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { renewalReminderSentFor: periodEnd },
      });
      sent += 1;
    } else {
      console.error(
        `[subscription-renewals] Partial failure for ${tenant.slug}: admin=${adminOk} tenant=${tenantOk}`
      );
      failed += 1;
    }
  }

  return { scanned, sent, failed };
}
