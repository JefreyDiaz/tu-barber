import { formatColombiaDate, formatColombiaTime } from '@/lib/date-utils';
import { getPlatformManyChatConfig, getTenantAppUrl, resolveManyChatConfig, type TenantManyChatSettings } from './get-config';
import { sendManyChatMessage } from './manychat';
import type {
  BarberMessageParams,
  BookingMessageParams,
  ManyChatConfig,
} from './types';

export type { ManyChatConfig, TenantManyChatSettings };

function buildFieldData(
  params: BookingMessageParams
): {
  customerName: string;
  barberName: string;
  bookingDate: string;
  bookingTime: string;
  barberPhone: string;
  cancelUrl: string;
  customerPhone?: string;
} {
  const cancelUrl = `${getTenantAppUrl(params.tenantSlug)}/cancelar/${params.bookingId}`;
  return {
    customerName: params.customerName,
    barberName: params.barberName,
    bookingDate: formatColombiaDate(params.dateTime),
    bookingTime: formatColombiaTime(params.dateTime),
    barberPhone: params.barberPhone ?? 'No disponible',
    cancelUrl,
    customerPhone: params.to.replace(/\D/g, ''),
  };
}

function getConfig(tenantSettings?: TenantManyChatSettings | null): ManyChatConfig | null {
  return resolveManyChatConfig(tenantSettings);
}

/**
 * Send booking confirmation WhatsApp to customer via ManyChat flow.
 * Does not throw — logs errors and returns silently (booking already saved).
 */
export async function sendBookingConfirmation(
  params: BookingMessageParams,
  tenantSettings?: TenantManyChatSettings | null
): Promise<void> {
  const config = getConfig(tenantSettings);
  if (!config) {
    console.warn('[ManyChat] Not configured: missing MANYCHAT_API_KEY');
    return;
  }

  const fieldData = buildFieldData(params);
  await sendManyChatMessage(
    config,
    params.to,
    config.flowBooking,
    fieldData,
    params.customerName
  );
}

/** Send new booking notification to barber via ManyChat flow */
export async function sendBarberNotification(
  params: BarberMessageParams,
  tenantSettings?: TenantManyChatSettings | null
): Promise<void> {
  const config = getConfig(tenantSettings);
  if (!config) {
    console.warn('[ManyChat] Not configured: missing MANYCHAT_API_KEY');
    return;
  }

  const fieldData = {
    customerName: params.customerName,
    barberName: params.barberName,
    bookingDate: formatColombiaDate(params.dateTime),
    bookingTime: formatColombiaTime(params.dateTime),
    barberPhone: params.barberPhone,
    cancelUrl: '',
    customerPhone: params.customerPhone.replace(/\D/g, ''),
  };

  await sendManyChatMessage(
    config,
    params.barberPhone,
    config.flowBarber,
    fieldData,
    params.barberName
  );
}

/**
 * Send booking reminder (~3h before) via ManyChat flow.
 * @returns true if message was accepted
 */
export async function sendBookingReminder(
  params: BookingMessageParams,
  tenantSettings?: TenantManyChatSettings | null
): Promise<boolean> {
  const config = getConfig(tenantSettings);
  if (!config) {
    console.warn('[ManyChat] Not configured: missing MANYCHAT_API_KEY');
    return false;
  }

  const fieldData = buildFieldData(params);
  return sendManyChatMessage(
    config,
    params.to,
    config.flowReminder,
    fieldData,
    params.customerName
  );
}

/** @deprecated Use sendBookingConfirmation — kept for gradual migration */
export const sendBookingConfirmationWhatsApp = sendBookingConfirmation;
/** @deprecated Use sendBarberNotification */
export const sendBarberNotificationWhatsApp = sendBarberNotification;
/** @deprecated Use sendBookingReminder */
export const sendBookingReminderWhatsApp = sendBookingReminder;

export { getPlatformManyChatConfig, resolveManyChatConfig, getTenantAppUrl };
