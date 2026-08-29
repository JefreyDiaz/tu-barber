import type { TenantTwilioSettings, TwilioConfig } from './types';
import { normalizeWhatsappFrom } from './phone';
import { buildTenantOrigin } from '@/lib/tenant/urls';
import { canUseOwnTwilio, type TenantSubscription } from '@/lib/tenant/subscription';

function pickNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function isValidTwilioAccountSid(sid: string | null | undefined): boolean {
  const trimmed = sid?.trim();
  return !!trimmed && trimmed.startsWith('AC') && trimmed.length >= 32;
}

/** Platform-level Twilio config from env vars */
export function getPlatformTwilioConfig(): TwilioConfig | null {
  const accountSid = pickNonEmpty(process.env.TWILIO_ACCOUNT_SID);
  const authToken = pickNonEmpty(process.env.TWILIO_AUTH_TOKEN);
  const whatsappFrom = pickNonEmpty(
    process.env.TWILIO_WHATSAPP_FROM,
    process.env.TWILIO_PHONE_NUMBER
  );

  if (!accountSid || !authToken || !whatsappFrom) return null;

  return {
    accountSid,
    authToken,
    whatsappFrom: normalizeWhatsappFrom(whatsappFrom),
    contentSidBooking: pickNonEmpty(
      process.env.TWILIO_CONTENT_SID_BOOKING,
      process.env.TWILIO_WHATSAPP_BOOKING_TEMPLATE_SID
    ),
    contentSidReminder: pickNonEmpty(
      process.env.TWILIO_CONTENT_SID_REMINDER,
      process.env.TWILIO_WHATSAPP_REMINDER_TEMPLATE_SID
    ),
  };
}

function buildTenantTwilioConfig(
  tenantSettings: TenantTwilioSettings
): TwilioConfig | null {
  const accountSid = pickNonEmpty(tenantSettings.twilioAccountSid);
  const authToken = pickNonEmpty(tenantSettings.twilioAuthToken);
  const from = pickNonEmpty(
    tenantSettings.twilioWhatsappFrom,
    process.env.TWILIO_WHATSAPP_FROM,
    process.env.TWILIO_PHONE_NUMBER
  );

  if (!isValidTwilioAccountSid(accountSid) || !authToken || !from) {
    return null;
  }

  return {
    accountSid: accountSid!,
    authToken,
    whatsappFrom: normalizeWhatsappFrom(from),
    contentSidBooking: pickNonEmpty(
      tenantSettings.twilioContentSidBooking,
      process.env.TWILIO_CONTENT_SID_BOOKING,
      process.env.TWILIO_WHATSAPP_BOOKING_TEMPLATE_SID
    ),
    contentSidReminder: pickNonEmpty(
      tenantSettings.twilioContentSidReminder,
      process.env.TWILIO_CONTENT_SID_REMINDER,
      process.env.TWILIO_WHATSAPP_REMINDER_TEMPLATE_SID
    ),
  };
}

/** Resolve Twilio config: tenant override (Cadena) or platform fallback */
export function resolveTwilioConfig(
  tenantSettings?: TenantTwilioSettings | null,
  tenant?: TenantSubscription | null
): TwilioConfig | null {
  const canUseTenantConfig = !tenant || canUseOwnTwilio(tenant);
  if (canUseTenantConfig && tenantSettings) {
    const tenantConfig = buildTenantTwilioConfig(tenantSettings);
    if (tenantConfig) return tenantConfig;

    const hasPartialTenantTwilio =
      pickNonEmpty(tenantSettings.twilioAccountSid) ||
      pickNonEmpty(tenantSettings.twilioAuthToken);

    if (hasPartialTenantTwilio) {
      console.warn(
        '[Twilio] Tenant Twilio config incomplete or invalid — falling back to platform credentials'
      );
    }
  }
  return getPlatformTwilioConfig();
}

/** Build tenant-aware app URL for cancel links and messaging */
export function getTenantAppUrl(tenantSlug?: string): string {
  if (tenantSlug) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
    if (rootDomain && !rootDomain.includes('localhost')) {
      return `https://${tenantSlug}.${rootDomain.replace(/^\.+/, '')}`;
    }
    return buildTenantOrigin(tenantSlug);
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}
