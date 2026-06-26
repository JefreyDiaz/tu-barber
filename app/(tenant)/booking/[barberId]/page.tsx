import BookingPageContent from './BookingPageContent';
import TenantSiteShell from '@/components/TenantSiteShell';
import { notFound } from 'next/navigation';
import { requireTenant } from '@/lib/tenant/context';
import { resolveTenantBranding } from '@/lib/tenant/branding';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';

interface BookingPageProps {
  readonly params: Promise<{ barberId: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { barberId } = await params;
  const tenant = await requireTenant();

  const db = scopedPrisma(tenant.id);
  const [barber, settings] = await Promise.all([
    db.user.findFirst({
      where: {
        id: barberId,
        role: { in: ['barbero', 'dueno'] },
        isActive: true,
      },
      select: { id: true, name: true },
    }),
    db.settings.findUnique(),
  ]);

  if (!barber) {
    notFound();
  }

  const branding = resolveTenantBranding(settings);

  return (
    <TenantSiteShell branding={branding} className="platform-bg min-h-screen min-h-[100dvh]">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:py-8">
        <div className="mx-auto w-full min-w-0 max-w-4xl">
          <BookingPageContent barberId={barberId} barberName={barber.name} />
        </div>
      </div>
    </TenantSiteShell>
  );
}
