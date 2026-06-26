import { extractSubdomain, isBareLocalhost, isLocalhostSubdomain } from './host';

const DEFAULT_DEV_PORT = process.env.PORT ?? '3000';

function rootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase() ?? 'tubarber.co';
}

function portFromHost(host: string): string {
  const colon = host.lastIndexOf(':');
  if (colon === -1) return DEFAULT_DEV_PORT;
  return host.slice(colon + 1) || DEFAULT_DEV_PORT;
}

/** localhost, 127.0.0.1, or slug.localhost */
export function isLocalTenantHost(host: string): boolean {
  return isBareLocalhost(host) || isLocalhostSubdomain(host);
}

/**
 * Dev vs prod for URL building during SSR/hydration.
 * Must not read `window` — server and client must agree on first paint.
 */
function useLocalTenantUrls(): boolean {
  return process.env.NODE_ENV === 'development';
}

/** Origin from incoming request host (server components / API). */
export function buildTenantOriginForRequest(slug: string, requestHost: string): string {
  if (isLocalTenantHost(requestHost)) {
    return `http://${slug}.localhost:${portFromHost(requestHost)}`;
  }
  return `https://${slug}.${rootDomain()}`;
}

/** Hostname label from incoming request host (server components). */
export function formatTenantHostForRequest(
  slug: string,
  requestHost: string,
  customDomain?: string | null
): string {
  if (customDomain) {
    return customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  if (isLocalTenantHost(requestHost)) {
    return `${slug}.localhost:${portFromHost(requestHost)}`;
  }
  return `${slug}.${rootDomain()}`;
}

/** Origin for a tenant: https://slug.tubarber.co or http://slug.localhost:3000 */
export function buildTenantOrigin(slug: string): string {
  if (useLocalTenantUrls()) {
    return `http://${slug}.localhost:${DEFAULT_DEV_PORT}`;
  }
  return `https://${slug}.${rootDomain()}`;
}

/** Hostname for display (no protocol): slug.localhost:3000 or slug.tubarber.co */
export function formatTenantHost(slug: string, customDomain?: string | null): string {
  if (customDomain) {
    return customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  if (useLocalTenantUrls()) {
    return `${slug}.localhost:${DEFAULT_DEV_PORT}`;
  }
  return `${slug}.${rootDomain()}`;
}

/** Full tenant URL with optional path */
export function buildTenantUrl(slug: string, path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${buildTenantOrigin(slug)}${normalized}`;
}

/** Tenant slug from browser hostname, or ?tenant= on Vercel preview */
export function getBrowserTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const fromHost = extractSubdomain(window.location.host);
  if (fromHost) return fromHost;
  return new URLSearchParams(window.location.search).get('tenant');
}

/** Internal link: path-only on subdomain; ?tenant= only when needed (legacy preview) */
export function tenantPath(path: string, slug?: string | null): string {
  if (typeof window !== 'undefined') {
    if (extractSubdomain(window.location.host)) return path;
    const q = getBrowserTenantSlug();
    if (q) {
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}tenant=${encodeURIComponent(q)}`;
    }
    return path;
  }
  if (slug) {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}tenant=${encodeURIComponent(slug)}`;
  }
  return path;
}

export { isBareLocalhost };
