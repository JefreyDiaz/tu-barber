import type { TenantTwilioSettings, TwilioConfig } from './types';
import { normalizeWhatsappFrom } from './phone';

/** Platform-level Twilio config from env vars */
export function getPlatformTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !whatsappFrom) return null;

  return {
    accountSid,
    authToken,
    whatsappFrom: normalizeWhatsappFrom(whatsappFrom),
    contentSidBooking: process.env.TWILIO_CONTENT_SID_BOOKING,
    contentSidBarber: process.env.TWILIO_CONTENT_SID_BARBER,
    contentSidReminder: process.env.TWILIO_CONTENT_SID_REMINDER,
    contentSidWelcome: process.env.TWILIO_CONTENT_SID_WELCOME,
  };
}

/** Resolve Twilio config: tenant override (Pro) or platform fallback */
export function resolveTwilioConfig(
  tenantSettings?: TenantTwilioSettings | null
): TwilioConfig | null {
  if (tenantSettings?.twilioAccountSid && tenantSettings?.twilioAuthToken) {
    const from = tenantSettings.twilioWhatsappFrom ?? process.env.TWILIO_WHATSAPP_FROM;
    if (!from) return null;

    return {
      accountSid: tenantSettings.twilioAccountSid,
      authToken: tenantSettings.twilioAuthToken,
      whatsappFrom: normalizeWhatsappFrom(from),
      contentSidBooking:
        tenantSettings.twilioContentSidBooking ?? process.env.TWILIO_CONTENT_SID_BOOKING,
      contentSidBarber:
        tenantSettings.twilioContentSidBarber ?? process.env.TWILIO_CONTENT_SID_BARBER,
      contentSidReminder:
        tenantSettings.twilioContentSidReminder ?? process.env.TWILIO_CONTENT_SID_REMINDER,
      contentSidWelcome: process.env.TWILIO_CONTENT_SID_WELCOME,
    };
  }
  return getPlatformTwilioConfig();
}

/** Build tenant-aware app URL for cancel links */
export function getTenantAppUrl(tenantSlug?: string): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (tenantSlug && rootDomain && !rootDomain.includes('localhost')) {
    return `https://${tenantSlug}.${rootDomain}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}
