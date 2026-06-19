import { headers } from 'next/headers';
import { findTenantBySlug } from './resolve';
import type { ResolvedTenant } from './resolve';

export const TENANT_HEADERS = {
  id: 'x-tenant-id',
  slug: 'x-tenant-slug',
  status: 'x-tenant-status',
  name: 'x-tenant-name',
} as const;

export const TENANT_SLUG_HEADER = 'x-tenant-slug';
export const TENANT_PLATFORM_HEADER = 'x-is-platform';

export async function isPlatformRequest(): Promise<boolean> {
  const h = await headers();
  return h.get(TENANT_PLATFORM_HEADER) === 'true';
}

export async function getTenantFromHeaders(): Promise<ResolvedTenant | null> {
  if (await isPlatformRequest()) return null;

  const h = await headers();
  const slug = h.get(TENANT_SLUG_HEADER);
  if (!slug) return null;

  return findTenantBySlug(slug);
}

export async function requireTenant(): Promise<ResolvedTenant> {
  const tenant = await getTenantFromHeaders();
  if (!tenant) {
    throw new Error('Tenant not resolved');
  }
  if (tenant.status !== 'active') {
    throw new Error(`Tenant is ${tenant.status}`);
  }
  return tenant;
}
