import { formatColombiaDate, formatColombiaTime } from '@/lib/date-utils';
import { formatLocalPhoneDigits } from './phone';
import {
  getPlatformTwilioConfig,
  getTenantAppUrl,
  resolveTwilioConfig,
} from './get-config';
import { sendTwilioTemplateMessage } from './twilio';
import type {
  BookingMessageParams,
  TenantTwilioSettings,
  TwilioConfig,
} from './types';
import type { TenantSubscription } from '@/lib/tenant/subscription';

export type { TenantTwilioSettings, TwilioConfig };

let twilioNotConfiguredLogged = false;

function warnTwilioNotConfigured(): void {
  if (twilioNotConfiguredLogged) return;
  twilioNotConfiguredLogged = true;
  console.warn(
    '[Twilio] Not configured: missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM'
  );
}

function getConfig(
  tenantSettings?: TenantTwilioSettings | null,
  tenant?: TenantSubscription | null
): TwilioConfig | null {
  return resolveTwilioConfig(tenantSettings, tenant);
}

function bookingVariables(params: BookingMessageParams): string[] {
  const cancelUrl = `${getTenantAppUrl(params.tenantSlug)}/cancelar/${params.bookingId}`;
  return [
    params.shopName,
    params.customerName,
    params.barberName,
    formatColombiaDate(params.dateTime),
    formatColombiaTime(params.dateTime),
    params.barberPhone
      ? formatLocalPhoneDigits(params.barberPhone)
      : 'No disponible',
    cancelUrl,
  ];
}

/**
 * Send booking confirmation WhatsApp to customer via Twilio template.
 * Does not throw — logs errors and returns silently (booking already saved).
 */
export async function sendBookingConfirmation(
  params: BookingMessageParams,
  tenantSettings?: TenantTwilioSettings | null,
  tenant?: TenantSubscription | null
): Promise<void> {
  const config = getConfig(tenantSettings, tenant);
  if (!config) {
    warnTwilioNotConfigured();
    return;
  }

  await sendTwilioTemplateMessage(
    config,
    params.to,
    config.contentSidBooking,
    bookingVariables(params)
  );
}

/**
 * Send booking reminder (~3h before) via Twilio template.
 * @returns true if message was accepted
 */
export async function sendBookingReminder(
  params: BookingMessageParams,
  tenantSettings?: TenantTwilioSettings | null,
  tenant?: TenantSubscription | null
): Promise<boolean> {
  const config = getConfig(tenantSettings, tenant);
  if (!config) {
    warnTwilioNotConfigured();
    return false;
  }

  return sendTwilioTemplateMessage(
    config,
    params.to,
    config.contentSidReminder,
    bookingVariables(params)
  );
}

export { getPlatformTwilioConfig, resolveTwilioConfig, getTenantAppUrl };
