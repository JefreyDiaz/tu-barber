import { NextRequest, NextResponse } from 'next/server';
import { findTenantBySlug, resolveTenantFromHost, type ResolvedTenant } from './resolve';

export const TENANT_SLUG_HEADER = 'x-tenant-slug';

export class TenantApiError extends Error {
  constructor(public readonly code: 'TENANT_NOT_FOUND' | 'TENANT_INACTIVE') {
    super(code);
    this.name = 'TenantApiError';
  }
}

export async function getTenantFromApiRequest(
  request: NextRequest | Request
): Promise<ResolvedTenant | null> {
  const headerSlug = request.headers.get(TENANT_SLUG_HEADER);
  if (headerSlug) {
    return findTenantBySlug(headerSlug);
  }

  const host = request.headers.get('host') ?? '';
  const tenantParam = new URL(request.url).searchParams.get('tenant');
  return resolveTenantFromHost(host, tenantParam);
}

export async function requireApiTenant(request: NextRequest | Request): Promise<ResolvedTenant> {
  const tenant = await getTenantFromApiRequest(request);
  if (!tenant) throw new TenantApiError('TENANT_NOT_FOUND');
  if (tenant.status !== 'active') throw new TenantApiError('TENANT_INACTIVE');
  return tenant;
}

export function tenantErrorStatus(error: unknown): { status: number; error: string } {
  if (error instanceof TenantApiError) {
    if (error.code === 'TENANT_NOT_FOUND') {
      return { status: 404, error: 'Barbería no encontrada' };
    }
    return { status: 403, error: 'Barbería no disponible' };
  }
  return { status: 500, error: 'Error interno' };
}

export function tenantApiErrorResponse(error: unknown): NextResponse {
  const { status, error: message } = tenantErrorStatus(error);
  return NextResponse.json({ success: false, error: message }, { status });
}
