import { prisma } from '@/lib/prisma';
import { buildTenantUrl } from '@/lib/tenant/urls';

export interface ShowcaseBarbershop {
  slug: string;
  name: string;
  logoUrl: string | null;
  href: string;
}

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
