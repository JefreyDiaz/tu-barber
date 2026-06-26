import type { TenantSettings } from '../../prisma/generated/prisma/client';

export const DEFAULT_PRIMARY_COLOR = '#e5b869';
export const DEFAULT_SECONDARY_COLOR = '#c8944a';
export const DEFAULT_BACKGROUND_URL = '/video/fondos/fondo-1.mp4';

export interface TenantBranding {
  logoUrl: string | null;
  backgroundUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export function resolveTenantBranding(
  settings: Pick<TenantSettings, 'logoUrl' | 'backgroundUrl' | 'primaryColor' | 'secondaryColor'> | null | undefined
): TenantBranding {
  return {
    logoUrl: settings?.logoUrl ?? null,
    backgroundUrl: settings?.backgroundUrl?.trim() || DEFAULT_BACKGROUND_URL,
    primaryColor: settings?.primaryColor?.trim() || DEFAULT_PRIMARY_COLOR,
    secondaryColor: settings?.secondaryColor?.trim() || DEFAULT_SECONDARY_COLOR,
  };
}

function stripUrlQuery(url: string): string {
  return url.split('?')[0] ?? url;
}

export function isVideoBackground(url: string): boolean {
  const lower = stripUrlQuery(url).toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || url.toLowerCase().includes('/video/');
}

export function videoBackgroundMimeType(url: string): 'video/mp4' | 'video/webm' {
  return stripUrlQuery(url).toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
}

export function brandingCssVars(branding: TenantBranding): Record<string, string> {
  return {
    '--tenant-primary': branding.primaryColor,
    '--tenant-secondary': branding.secondaryColor,
  };
}

export function sanitizeBrandingPayload(data: {
  logoUrl?: string;
  backgroundUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  return {
    logoUrl: data.logoUrl?.trim() ? data.logoUrl.trim() : null,
    backgroundUrl: data.backgroundUrl?.trim() ? data.backgroundUrl.trim() : null,
    primaryColor: data.primaryColor?.trim() || null,
    secondaryColor: data.secondaryColor?.trim() || null,
  };
}
