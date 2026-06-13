import { prisma } from '@/lib/prisma';
import { sendBookingReminderWhatsApp } from '@/lib/twilio';

/** Horas antes de la cita en las que se intenta enviar el recordatorio (centro de la ventana). */
const REMINDER_HOURS_BEFORE = 3;
/** Mitad de la ventana en minutos (cron cada 15 min debe cubrir la ventana completa). */
const REMINDER_WINDOW_HALF_WIDTH_MINUTES = 15;

function getReminderWindowBounds(now: Date): { windowStart: Date; windowEnd: Date } {
  const ms = REMINDER_WINDOW_HALF_WIDTH_MINUTES * 60 * 1000;
  const targetMs = REMINDER_HOURS_BEFORE * 60 * 60 * 1000;
  return {
    windowStart: new Date(now.getTime() + targetMs - ms),
    windowEnd: new Date(now.getTime() + targetMs + ms),
  };
}

/**
 * Busca reservas elegibles y envía recordatorio por WhatsApp (una vez por reserva).
 * @returns contadores para logs / respuesta del cron
 */
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
      dateTime: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: {
      barber: { select: { name: true, phone: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    const ok = await sendBookingReminderWhatsApp({
      to: booking.customerPhone,
      customerName: booking.customerName,
      barberName: booking.barber.name,
      barberPhone: booking.barber.phone,
      dateTime: booking.dateTime,
      bookingId: booking.id,
    });

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
