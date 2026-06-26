import { prisma } from '@/lib/prisma';
import type { Tenant } from '../../prisma/generated/prisma/client';
import { extractSubdomain, isPlatformHost } from './host';

export type TenantStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface ResolvedTenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  customDomain: string | null;
  timezone: string;
}

function toResolvedTenant(t: Tenant): ResolvedTenant {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    status: t.status as TenantStatus,
    plan: t.plan,
    subscriptionStatus: t.subscriptionStatus,
    trialEndsAt: t.trialEndsAt,
    customDomain: t.customDomain,
    timezone: t.timezone,
  };
}

export async function findTenantBySlug(slug: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  return tenant ? toResolvedTenant(tenant) : null;
}

export async function findTenantByCustomDomain(domain: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findUnique({ where: { customDomain: domain } });
  return tenant ? toResolvedTenant(tenant) : null;
}

export async function findTenantById(id: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  return tenant ? toResolvedTenant(tenant) : null;
}

export async function resolveTenantFromHost(
  host: string,
  tenantQueryParam?: string | null
): Promise<ResolvedTenant | null> {
  if (tenantQueryParam) {
    return findTenantBySlug(tenantQueryParam);
  }

  const hostname = host.split(':')[0].toLowerCase();

  if (!hostname.includes('localhost') && !hostname.startsWith('127.0.0.1')) {
    const byDomain = await findTenantByCustomDomain(hostname);
    if (byDomain) return byDomain;
  }

  const sub = extractSubdomain(host);
  if (sub) {
    return findTenantBySlug(sub);
  }

  if (isPlatformHost(host)) {
    return null;
  }

  return null;
}
