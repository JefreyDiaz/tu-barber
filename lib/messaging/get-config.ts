import type { ManyChatConfig, ManyChatFieldMap } from './types';

const MANYCHAT_BASE = 'https://api.manychat.com';

function parseFieldMap(raw: string | undefined): ManyChatFieldMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ManyChatFieldMap;
  } catch {
    console.warn('[ManyChat] Invalid MANYCHAT_FIELD_MAP JSON');
    return {};
  }
}

/** Platform-level ManyChat config from env vars */
export function getPlatformManyChatConfig(): ManyChatConfig | null {
  const apiKey = process.env.MANYCHAT_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    flowBooking: process.env.MANYCHAT_FLOW_BOOKING,
    flowBarber: process.env.MANYCHAT_FLOW_BARBER,
    flowReminder: process.env.MANYCHAT_FLOW_REMINDER,
    fieldMap: parseFieldMap(process.env.MANYCHAT_FIELD_MAP),
  };
}

export interface TenantManyChatSettings {
  manychatApiKey?: string | null;
  manychatFlowBooking?: string | null;
  manychatFlowBarber?: string | null;
  manychatFlowReminder?: string | null;
  manychatFieldMap?: ManyChatFieldMap | null;
}

/** Resolve ManyChat config: tenant override or platform fallback */
export function resolveManyChatConfig(
  tenantSettings?: TenantManyChatSettings | null
): ManyChatConfig | null {
  if (tenantSettings?.manychatApiKey) {
    return {
      apiKey: tenantSettings.manychatApiKey,
      flowBooking: tenantSettings.manychatFlowBooking ?? undefined,
      flowBarber: tenantSettings.manychatFlowBarber ?? undefined,
      flowReminder: tenantSettings.manychatFlowReminder ?? undefined,
      fieldMap: (tenantSettings.manychatFieldMap as ManyChatFieldMap) ?? {},
    };
  }
  return getPlatformManyChatConfig();
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
