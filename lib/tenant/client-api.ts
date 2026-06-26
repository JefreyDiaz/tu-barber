'use client';

import { extractSubdomain } from './host';
import { getBrowserTenantSlug } from './urls';

function needsTenantQuery(): boolean {
  if (typeof window === 'undefined') return false;
  return !extractSubdomain(window.location.host);
}

/** API path — Host header resolves tenant on subdomain; ?tenant= only on Vercel preview */
export function tenantApiUrl(path: string): string {
  if (typeof window === 'undefined' || !needsTenantQuery()) return path;
  const slug = getBrowserTenantSlug();
  if (!slug) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}tenant=${encodeURIComponent(slug)}`;
}

/** Internal link — path-only on subdomain */
export function tenantHref(path: string, search?: string): string {
  if (typeof window !== 'undefined' && !needsTenantQuery()) return path;
  const slug = search
    ? new URLSearchParams(search).get('tenant')
    : typeof window !== 'undefined'
      ? getBrowserTenantSlug()
      : null;
  if (!slug) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}tenant=${encodeURIComponent(slug)}`;
}
