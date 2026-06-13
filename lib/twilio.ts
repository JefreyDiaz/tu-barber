import Twilio from 'twilio';
import { formatColombiaDate, formatColombiaTime } from './date-utils';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const bookingTemplateSid = process.env.TWILIO_WHATSAPP_BOOKING_TEMPLATE_SID;
const barberTemplateSid = process.env.TWILIO_WHATSAPP_BARBER_TEMPLATE_SID;
const reminderTemplateSid = process.env.TWILIO_WHATSAPP_REMINDER_TEMPLATE_SID;

function getClient(): Twilio.Twilio | null {
  if (!accountSid || !authToken || !fromNumber) return null;
  return Twilio(accountSid, authToken);
}

function formatDateTime(dateTime: Date) {
  return {
    dateStr: formatColombiaDate(dateTime),
    timeStr: formatColombiaTime(dateTime),
  };
}

/** Genera la URL base de la app */
function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Envía un mensaje por WhatsApp al cliente con los datos de la reserva.
 * No lanza error si Twilio no está configurado o falla (solo registra en consola).
 */
export async function sendBookingConfirmationWhatsApp(params: {
  to: string;
  customerName: string;
  barberName: string;
  barberPhone?: string | null;
  dateTime: Date;
  bookingId: string;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn('[Twilio] No configurado: falta TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_PHONE_NUMBER');
    return;
  }

  const { to, customerName, barberName, barberPhone, dateTime, bookingId } = params;
  const { dateStr, timeStr } = formatDateTime(dateTime);
  const cancelUrl = `${getAppUrl()}/cancelar/${bookingId}`;

  const lines = [
    `¡Hola ${customerName}! 👋`,
    '',
    '✅ Tu reserva está confirmada.',
    '',
    '📋 Detalles:',
    `✂️ Barbero: ${barberName}`,
    `📅 Fecha: ${dateStr}`,
    `🕐 Hora: ${timeStr}`,
  ];

  if (barberPhone) {
    lines.push(`📞 Contacto barbero: ${barberPhone}`);
  }

  lines.push(
    '',
    `❌ ¿Necesitas cancelar? Toca aquí:`,
    cancelUrl,
    '',
    'Gracias por confiar en nosotros. 🙌',
  );

  const body = lines.join('\n');

  const fromWhatsApp = `whatsapp:${fromNumber}`;
  const toWhatsApp = `whatsapp:${to}`;

  try {
    if (bookingTemplateSid) {
      await client.messages.create({
        contentSid: bookingTemplateSid,
        contentVariables: JSON.stringify({
          1: customerName,
          2: barberName,
          3: dateStr,
          4: timeStr,
          5: barberPhone ?? 'No disponible',
          6: cancelUrl,
        }),
        from: fromWhatsApp,
        to: toWhatsApp,
      });
      console.log(`[Twilio] WhatsApp con plantilla enviado al cliente: ${to}`);
      return;
    }

    console.warn('[Twilio] Falta TWILIO_WHATSAPP_BOOKING_TEMPLATE_SID. Enviando mensaje libre al cliente.');
    await client.messages.create({
      body,
      from: fromWhatsApp,
      to: toWhatsApp,
    });
    console.log(`[Twilio] WhatsApp libre enviado al cliente: ${to}`);
  } catch (err) {
    console.error('[Twilio] Error enviando WhatsApp al cliente:', err);
  }
}

/**
 * Envía un mensaje por WhatsApp al barbero notificándole de una nueva reserva.
 * No lanza error si Twilio no está configurado o falla (solo registra en consola).
 */
export async function sendBarberNotificationWhatsApp(params: {
  barberPhone: string;
  barberName: string;
  customerName: string;
  customerPhone: string;
  dateTime: Date;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn('[Twilio] No configurado: falta TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_PHONE_NUMBER');
    return;
  }

  const { barberPhone, barberName, customerName, customerPhone, dateTime } = params;
  const { dateStr, timeStr } = formatDateTime(dateTime);

  const body = [
    `¡Hola ${barberName}! 💈`,
    '',
    '📢 Tienes una nueva reserva.',
    '',
    '📋 Detalles:',
    `👤 Cliente: ${customerName}`,
    `📞 Teléfono: ${customerPhone}`,
    `📅 Fecha: ${dateStr}`,
    `🕐 Hora: ${timeStr}`,
    '',
    '¡Prepárate para atender! ✂️',
  ].join('\n');

  const fromWhatsApp = `whatsapp:${fromNumber}`;
  const toWhatsApp = `whatsapp:${barberPhone}`;

  try {
    if (barberTemplateSid) {
      await client.messages.create({
        contentSid: barberTemplateSid,
        contentVariables: JSON.stringify({
          1: barberName,
          2: customerName,
          3: customerPhone,
          4: dateStr,
          5: timeStr,
        }),
        from: fromWhatsApp,
        to: toWhatsApp,
      });
      console.log(`[Twilio] WhatsApp con plantilla enviado al barbero: ${barberPhone}`);
      return;
    }

    console.warn('[Twilio] Falta TWILIO_WHATSAPP_BARBER_TEMPLATE_SID. Enviando mensaje libre al barbero.');
    await client.messages.create({
      body,
      from: fromWhatsApp,
      to: toWhatsApp,
    });
    console.log(`[Twilio] WhatsApp libre enviado al barbero: ${barberPhone}`);
  } catch (err) {
    console.error('[Twilio] Error enviando WhatsApp al barbero:', err);
  }
}

/**
 * Recordatorio de cita (~3 h antes; la ventana la define el cron).
 * @returns true si Twilio aceptó el mensaje; false si no hay cliente, error o plantilla obligatoria ausente.
 */
export async function sendBookingReminderWhatsApp(params: {
  to: string;
  customerName: string;
  barberName: string;
  barberPhone?: string | null;
  dateTime: Date;
  bookingId: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.warn('[Twilio] No configurado: falta TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_PHONE_NUMBER');
    return false;
  }

  const { to, customerName, barberName, barberPhone, dateTime, bookingId } = params;
  const { timeStr } = formatDateTime(dateTime);
  const cancelUrl = `${getAppUrl()}/cancelar/${bookingId}`;

  const lines = [
    `¡Hola ${customerName}!`,
    '',
    '⏰ Recordatorio: tu cita es en unas horas.',
    '',
    `✂️ Barbero: ${barberName}`,
    `🕐 ${timeStr}`,
  ];
  if (barberPhone) {
    lines.push(`📞 Contacto: ${barberPhone}`);
  }
  lines.push('', `¿Cancelar? ${cancelUrl}`);

  const body = lines.join('\n');
  const fromWhatsApp = `whatsapp:${fromNumber}`;
  const toWhatsApp = `whatsapp:${to}`;

  try {
    if (reminderTemplateSid) {
      await client.messages.create({
        contentSid: reminderTemplateSid,
        contentVariables: JSON.stringify({
          1: customerName,
          2: barberName,
          3: timeStr,
          4: barberPhone ?? 'No disponible',
          5: cancelUrl,
        }),
        from: fromWhatsApp,
        to: toWhatsApp,
      });
      console.log(`[Twilio] WhatsApp recordatorio (plantilla) enviado a: ${to}`);
      return true;
    }

    console.warn('[Twilio] Falta TWILIO_WHATSAPP_REMINDER_TEMPLATE_SID. Enviando mensaje libre (sandbox o 24h).');
    await client.messages.create({
      body,
      from: fromWhatsApp,
      to: toWhatsApp,
    });
    console.log(`[Twilio] WhatsApp recordatorio (libre) enviado a: ${to}`);
    return true;
  } catch (err) {
    console.error('[Twilio] Error enviando recordatorio WhatsApp:', err);
    return false;
  }
}
