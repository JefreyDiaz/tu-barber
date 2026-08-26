import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomain, isBareLocalhost, isPlatformHost } from '@/lib/tenant/host';
import {
  TENANT_PATHNAME_HEADER,
  TENANT_PLATFORM_HEADER,
  TENANT_SLUG_HEADER,
} from '@/lib/tenant/headers';

export { TENANT_SLUG_HEADER } from '@/lib/tenant/headers';

export const TENANT_SLUG_COOKIE = 'tenant-slug';

/** NextAuth internal routes skip tenant resolution; custom tenant auth APIs do not. */
function shouldSkipTenantMiddleware(pathname: string): boolean {
  if (pathname.startsWith('/_next')) return true;
  if (/\.(ico|png|jpg|svg|webmanifest|mp4|css|js)$/.test(pathname)) return true;
  if (!pathname.startsWith('/api/auth')) return false;
  return (
    pathname !== '/api/auth/forgot-password' && pathname !== '/api/auth/change-password'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? 'localhost:3000';
  const tenantParam = request.nextUrl.searchParams.get('tenant');
  const cookieSlug = request.cookies.get(TENANT_SLUG_COOKIE)?.value ?? null;

  if (shouldSkipTenantMiddleware(pathname)) {
    return NextResponse.next();
  }

  // Dev: redirect ?tenant=slug on bare localhost → slug.localhost:port
  if (isBareLocalhost(host) && tenantParam) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('tenant');
    redirectUrl.hostname = `${tenantParam}.localhost`;
    return NextResponse.redirect(redirectUrl);
  }

  const subdomain = extractSubdomain(host);

  const tenantRoutes =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/cancelar') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/bookings') ||
    pathname.startsWith('/api/services') ||
    pathname.startsWith('/api/auth/forgot-password') ||
    pathname.startsWith('/api/auth/change-password');

  const resolvedParam =
    !subdomain && tenantParam ? tenantParam : !subdomain && tenantRoutes ? cookieSlug : null;

  const isPlatform = isPlatformHost(host) && !subdomain && !resolvedParam;

  if (isPlatform) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(TENANT_PLATFORM_HEADER, 'true');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const slug = subdomain ?? resolvedParam;
  if (!slug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(TENANT_PLATFORM_HEADER, 'true');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_SLUG_HEADER, slug);
  requestHeaders.set(TENANT_PLATFORM_HEADER, 'false');
  requestHeaders.set(TENANT_PATHNAME_HEADER, pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.cookies.set(TENANT_SLUG_COOKIE, slug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|image|video).*)'],
};
