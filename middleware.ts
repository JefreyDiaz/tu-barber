import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomain, isPlatformHost } from '@/lib/tenant/host';

export const TENANT_SLUG_HEADER = 'x-tenant-slug';
export const TENANT_PLATFORM_HEADER = 'x-is-platform';
export const TENANT_SLUG_COOKIE = 'tenant-slug';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? 'localhost:3000';
  const tenantParam = request.nextUrl.searchParams.get('tenant');
  const cookieSlug = request.cookies.get(TENANT_SLUG_COOKIE)?.value ?? null;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    /\.(ico|png|jpg|svg|webmanifest|mp4|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const tenantRoutes =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/cancelar') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/bookings') ||
    pathname.startsWith('/api/services');

  const resolvedParam = tenantParam ?? (tenantRoutes ? cookieSlug : null);
  const isPlatform = isPlatformHost(host, resolvedParam);

  if (isPlatform) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(TENANT_PLATFORM_HEADER, 'true');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const slug =
    resolvedParam ?? extractSubdomain(host) ?? process.env.DEFAULT_TENANT_SLUG ?? 'the-barber-house';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_SLUG_HEADER, slug);
  requestHeaders.set(TENANT_PLATFORM_HEADER, 'false');

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (tenantParam) {
    response.cookies.set(TENANT_SLUG_COOKIE, tenantParam, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|image|video).*)'],
};
