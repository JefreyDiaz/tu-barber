import { prisma } from '@/lib/prisma';
import { getPlatformAppUrl } from '@/lib/email/get-config';
import { buildTenantUrl } from '@/lib/tenant/urls';
import {
  BARBERSHOPS_SECTION_ID,
  type ShowcaseBarbershop,
} from '@/lib/tenant/showcase';

export type { ShowcaseBarbershop } from '@/lib/tenant/showcase';
export { BARBERSHOPS_SECTION_ID, BARBERSHOPS_SECTION_HASH } from '@/lib/tenant/showcase';

export const BARBERSHOPS_LANDING_URL = `${getPlatformAppUrl()}#${BARBERSHOPS_SECTION_ID}`;

/** Active tenants for the platform landing showcase carousel. */
export async function getActiveBarbershopsForShowcase(): Promise<ShowcaseBarbershop[]> {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    orderBy: { name: 'asc' },
    select: {
      slug: true,
      name: true,
      settings: { select: { logoUrl: true } },
    },
  });

  return tenants.map((t) => ({
    slug: t.slug,
    name: t.name,
    logoUrl: t.settings?.logoUrl?.trim() || null,
    href: buildTenantUrl(t.slug, '/'),
  }));
}
