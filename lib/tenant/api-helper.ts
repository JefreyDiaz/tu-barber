import { NextRequest } from 'next/server';
import { findTenantBySlug, type ResolvedTenant } from './resolve';

export const TENANT_SLUG_HEADER = 'x-tenant-slug';

export async function getTenantFromApiRequest(request: NextRequest): Promise<ResolvedTenant | null> {
  const slug = request.headers.get(TENANT_SLUG_HEADER);
  if (!slug) return null;
  return findTenantBySlug(slug);
}

export async function requireApiTenant(request: NextRequest): Promise<ResolvedTenant> {
  const tenant = await getTenantFromApiRequest(request);
  if (!tenant) throw new Error('TENANT_NOT_FOUND');
  if (tenant.status !== 'active') throw new Error('TENANT_INACTIVE');
  return tenant;
}
