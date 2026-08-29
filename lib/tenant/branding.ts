import type { TenantSettings } from '../../prisma/generated/prisma/client';

export const DEFAULT_PRIMARY_COLOR = '#e5b869';
export const DEFAULT_SECONDARY_COLOR = '#c8944a';
/** Texto sobre fondo oscuro (formulario, fechas, etc.) */
export const DEFAULT_TEXT_COLOR = '#ffffff';
/** Texto sobre botones con gradiente primario/secundario */
export const DEFAULT_BUTTON_TEXT_COLOR = '#1c1917';
/** Valor legacy: antes se usaba como único "textColor" — tratar como sin personalizar */
const LEGACY_TEXT_COLOR = '#1c1917';

export function resolveStoredTextColor(stored: string | null | undefined): string {
  const trimmed = stored?.trim();
  if (!trimmed || trimmed.toLowerCase() === LEGACY_TEXT_COLOR) {
    return DEFAULT_TEXT_COLOR;
  }
  return trimmed;
}

export function normalizeTextColorForStorage(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === DEFAULT_TEXT_COLOR.toLowerCase()) {
    return null;
  }
  return trimmed;
}
export const DEFAULT_BACKGROUND_URL = '/video/fondos/fondo-1.mp4';

export interface TenantBranding {
  logoUrl: string | null;
  backgroundUrl: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  buttonTextColor: string;
}

type BrandingSettings = Pick<
  TenantSettings,
  'logoUrl' | 'backgroundUrl' | 'primaryColor' | 'secondaryColor' | 'textColor' | 'buttonTextColor'
>;

export function resolveTenantBranding(settings: BrandingSettings | null | undefined): TenantBranding {
  return {
    logoUrl: settings?.logoUrl ?? null,
    backgroundUrl: settings?.backgroundUrl?.trim() || DEFAULT_BACKGROUND_URL,
    primaryColor: settings?.primaryColor?.trim() || DEFAULT_PRIMARY_COLOR,
    secondaryColor: settings?.secondaryColor?.trim() || DEFAULT_SECONDARY_COLOR,
    textColor: resolveStoredTextColor(settings?.textColor),
    buttonTextColor: settings?.buttonTextColor?.trim() || DEFAULT_BUTTON_TEXT_COLOR,
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
    '--tenant-text': branding.textColor,
    '--tenant-button-text': branding.buttonTextColor,
  };
}

export function sanitizeBrandingPayload(data: {
  logoUrl?: string;
  backgroundUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  buttonTextColor?: string;
}) {
  return {
    logoUrl: data.logoUrl?.trim() ? data.logoUrl.trim() : null,
    backgroundUrl: data.backgroundUrl?.trim() ? data.backgroundUrl.trim() : null,
    primaryColor: data.primaryColor?.trim() || null,
    secondaryColor: data.secondaryColor?.trim() || null,
    textColor: normalizeTextColorForStorage(data.textColor),
    buttonTextColor: data.buttonTextColor?.trim() || null,
  };
}
