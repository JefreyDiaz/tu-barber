import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { findTenantBySlug } from './resolve';
import type { ResolvedTenant } from './resolve';
import {
  TENANT_HEADERS,
  TENANT_PLATFORM_HEADER,
  TENANT_SLUG_HEADER,
} from './headers';

export { TENANT_HEADERS, TENANT_PLATFORM_HEADER, TENANT_SLUG_HEADER } from './headers';

export async function isPlatformRequest(): Promise<boolean> {
  const h = await headers();
  return h.get(TENANT_PLATFORM_HEADER) === 'true';
}

export async function getRequestedTenantSlug(): Promise<string | null> {
  if (await isPlatformRequest()) return null;
  const h = await headers();
  return h.get(TENANT_SLUG_HEADER);
}

export async function getTenantFromHeaders(): Promise<ResolvedTenant | null> {
  const slug = await getRequestedTenantSlug();
  if (!slug) return null;
  return findTenantBySlug(slug);
}

/** 404 when slug was resolved but tenant does not exist in DB. */
export async function assertTenantExists(): Promise<ResolvedTenant | null> {
  const slug = await getRequestedTenantSlug();
  if (!slug) return null;

  const tenant = await getTenantFromHeaders();
  if (!tenant) notFound();
  return tenant;
}

export async function requireTenant(): Promise<ResolvedTenant> {
  const tenant = await assertTenantExists();
  if (!tenant) notFound();
  if (tenant.status !== 'active') {
    notFound();
  }
  return tenant;
}
