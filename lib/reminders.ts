import { prisma } from '@/lib/prisma';
import { sendBookingReminder } from '@/lib/messaging/booking-messages';

const REMINDER_HOURS_BEFORE = 3;
const REMINDER_WINDOW_HALF_WIDTH_MINUTES = 15;

function getReminderWindowBounds(now: Date): { windowStart: Date; windowEnd: Date } {
  const ms = REMINDER_WINDOW_HALF_WIDTH_MINUTES * 60 * 1000;
  const targetMs = REMINDER_HOURS_BEFORE * 60 * 60 * 1000;
  return {
    windowStart: new Date(now.getTime() + targetMs - ms),
    windowEnd: new Date(now.getTime() + targetMs + ms),
  };
}

export async function processBookingReminders(now: Date = new Date()): Promise<{
  scanned: number;
  sent: number;
  failed: number;
}> {
  const { windowStart, windowEnd } = getReminderWindowBounds(now);

  const bookings = await prisma.booking.findMany({
    where: {
      reminderSentAt: null,
      status: { in: ['pending', 'confirmed'] },
      dateTime: { gte: windowStart, lte: windowEnd },
    },
    include: {
      barber: { select: { name: true, phone: true } },
      tenant: {
        select: {
          name: true,
          slug: true,
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          settings: {
            select: {
              twilioAccountSid: true,
              twilioAuthToken: true,
              twilioWhatsappFrom: true,
              twilioContentSidBooking: true,
              twilioContentSidBarber: true,
              twilioContentSidReminder: true,
            },
          },
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    const settings = booking.tenant.settings;
    const tenantSettings = settings
      ? {
          twilioAccountSid: settings.twilioAccountSid,
          twilioAuthToken: settings.twilioAuthToken,
          twilioWhatsappFrom: settings.twilioWhatsappFrom,
          twilioContentSidBooking: settings.twilioContentSidBooking,
          twilioContentSidBarber: settings.twilioContentSidBarber,
          twilioContentSidReminder: settings.twilioContentSidReminder,
        }
      : null;

    const ok = await sendBookingReminder(
      {
        to: booking.customerPhone,
        shopName: booking.tenant.name,
        customerName: booking.customerName,
        barberName: booking.barber.name,
        barberPhone: booking.barber.phone,
        dateTime: booking.dateTime,
        bookingId: booking.id,
        tenantSlug: booking.tenant.slug,
      },
      tenantSettings,
      {
        plan: booking.tenant.plan,
        subscriptionStatus: booking.tenant.subscriptionStatus,
        trialEndsAt: booking.tenant.trialEndsAt,
      }
    );

    if (ok) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return { scanned: bookings.length, sent, failed };
}
