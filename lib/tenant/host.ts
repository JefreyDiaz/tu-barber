const PLATFORM_SUBDOMAINS = new Set(['app', 'www']);

/** Vercel preview/production URLs are platform, not tenant subdomains. */
const PLATFORM_HOST_SUFFIXES = ['.vercel.app'];

function hostnameFromHost(host: string): string {
  return host.split(':')[0].toLowerCase();
}

export function isBareLocalhost(host: string): boolean {
  const hostname = hostnameFromHost(host);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isLocalhostSubdomain(host: string): boolean {
  const hostname = hostnameFromHost(host);
  return hostname.endsWith('.localhost') && hostname !== 'localhost';
}

export function isVercelHost(hostname: string): boolean {
  return PLATFORM_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

export function isPlatformHost(host: string): boolean {
  const hostname = hostnameFromHost(host);

  if (isBareLocalhost(host)) {
    return true;
  }

  if (isLocalhostSubdomain(host)) {
    return false;
  }

  if (isVercelHost(hostname)) {
    return true;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  if (rootDomain && (hostname === rootDomain || hostname === `www.${rootDomain}`)) {
    return true;
  }

  const parts = hostname.split('.');
  if (parts.length <= 2) return true;

  return PLATFORM_SUBDOMAINS.has(parts[0]);
}

export function extractSubdomain(host: string): string | null {
  const hostname = hostnameFromHost(host);

  if (isLocalhostSubdomain(host)) {
    const sub = hostname.slice(0, -'.localhost'.length);
    if (!sub || sub.includes('.')) return null;
    if (PLATFORM_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  if (isBareLocalhost(host)) {
    return null;
  }

  if (isVercelHost(hostname)) {
    return null;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  if (rootDomain && (hostname === rootDomain || hostname === `www.${rootDomain}`)) {
    return null;
  }

  const parts = hostname.split('.');
  if (parts.length < 3) return null;

  const sub = parts[0];
  if (PLATFORM_SUBDOMAINS.has(sub)) return null;

  return sub;
}
