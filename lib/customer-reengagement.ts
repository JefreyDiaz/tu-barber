import { prisma } from '@/lib/prisma';
import {
  DEFAULT_TIMEZONE,
  isLocalDayAndHour,
  isLocalDayOfMonth,
  monthPeriodKey,
} from '@/lib/dates/timezone';
import { sendCustomerReengagementMessage } from '@/lib/messaging/reengagement-message';
import { toE164 } from '@/lib/messaging/phone';

export const MONTHLY_REENGAGEMENT_TYPE = 'monthly_reengagement';
/** External cron (cron-job.org): monthly on day 15 at 09:00 America/Bogota. */
export const REENGAGEMENT_DAY_OF_MONTH = 15;
export const REENGAGEMENT_HOUR = 9;
export const REENGAGEMENT_TIMEZONE = DEFAULT_TIMEZONE;

const EMPTY_RESULT = {
  tenantsScanned: 0,
  customersScanned: 0,
  sent: 0,
  skipped: 0,
  failed: 0,
} as const;

const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due'] as const;

type TenantCustomer = {
  phone: string;
  name: string;
};

function uniqueCustomersFromBookings(
  bookings: Array<{ customerPhone: string; customerName: string }>
): TenantCustomer[] {
  const byPhone = new Map<string, string>();

  for (const booking of bookings) {
    const phone = toE164(booking.customerPhone);
    if (!byPhone.has(phone)) {
      byPhone.set(phone, booking.customerName);
    }
  }

  return Array.from(byPhone.entries()).map(([phone, name]) => ({ phone, name }));
}

async function getEligibleCustomers(tenantId: string): Promise<TenantCustomer[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      tenantId,
      status: { not: 'cancelled' },
    },
    select: {
      customerPhone: true,
      customerName: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return uniqueCustomersFromBookings(bookings);
}

export async function processMonthlyCustomerReengagement(now: Date = new Date()): Promise<{
  tenantsScanned: number;
  customersScanned: number;
  sent: number;
  skipped: number;
  failed: number;
  skippedReason?: string;
}> {
  if (!isLocalDayOfMonth(now, REENGAGEMENT_TIMEZONE, REENGAGEMENT_DAY_OF_MONTH)) {
    return { ...EMPTY_RESULT, skippedReason: 'not_day_15' };
  }

  if (!isLocalDayAndHour(now, REENGAGEMENT_TIMEZONE, REENGAGEMENT_DAY_OF_MONTH, REENGAGEMENT_HOUR)) {
    return { ...EMPTY_RESULT, skippedReason: 'not_send_hour' };
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'active',
      subscriptionStatus: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      settings: {
        select: {
          twilioAccountSid: true,
          twilioAuthToken: true,
          twilioWhatsappFrom: true,
          twilioContentSidBooking: true,
          twilioContentSidReminder: true,
        },
      },
    },
  });

  let tenantsScanned = 0;
  let customersScanned = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const tenant of tenants) {
    if (
      !isLocalDayAndHour(now, tenant.timezone, REENGAGEMENT_DAY_OF_MONTH, REENGAGEMENT_HOUR)
    ) {
      continue;
    }

    tenantsScanned += 1;
    const periodKey = monthPeriodKey(now, tenant.timezone);
    const customers = await getEligibleCustomers(tenant.id);
    customersScanned += customers.length;

    if (customers.length === 0) continue;

    const alreadySent = await prisma.customerOutreach.findMany({
      where: {
        tenantId: tenant.id,
        outreachType: MONTHLY_REENGAGEMENT_TYPE,
        periodKey,
      },
      select: { customerPhone: true },
    });
    const sentPhones = new Set(alreadySent.map((row) => row.customerPhone));

    const tenantSettings = tenant.settings
      ? {
          twilioAccountSid: tenant.settings.twilioAccountSid,
          twilioAuthToken: tenant.settings.twilioAuthToken,
          twilioWhatsappFrom: tenant.settings.twilioWhatsappFrom,
          twilioContentSidBooking: tenant.settings.twilioContentSidBooking,
          twilioContentSidReminder: tenant.settings.twilioContentSidReminder,
        }
      : null;

    for (const customer of customers) {
      if (sentPhones.has(customer.phone)) {
        skipped += 1;
        continue;
      }

      const ok = await sendCustomerReengagementMessage(
        {
          to: customer.phone,
          customerName: customer.name,
          shopName: tenant.name,
          tenantSlug: tenant.slug,
        },
        tenantSettings,
        {
          plan: tenant.plan,
          subscriptionStatus: tenant.subscriptionStatus,
          trialEndsAt: tenant.trialEndsAt,
        }
      );

      if (!ok) {
        failed += 1;
        continue;
      }

      try {
        await prisma.customerOutreach.create({
          data: {
            tenantId: tenant.id,
            customerPhone: customer.phone,
            outreachType: MONTHLY_REENGAGEMENT_TYPE,
            periodKey,
            customerName: customer.name,
          },
        });
        sent += 1;
      } catch {
        skipped += 1;
      }
    }
  }

  return { tenantsScanned, customersScanned, sent, skipped, failed };
}
