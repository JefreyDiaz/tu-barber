'use client';

/** Append ?tenant=slug from current URL to API paths (local dev) */
export function tenantApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const slug = new URLSearchParams(window.location.search).get('tenant');
  if (!slug) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}tenant=${encodeURIComponent(slug)}`;
}

/** Preserve tenant query in internal admin links (client components) */
export function tenantHref(path: string, search?: string): string {
  const slug = search
    ? new URLSearchParams(search).get('tenant')
    : typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('tenant')
      : null;
  if (!slug) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}tenant=${encodeURIComponent(slug)}`;
}
