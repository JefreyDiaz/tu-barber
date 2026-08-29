import BarberCarousel, { BarberSelectionText } from '@/components/BarberCarousel';
import LogoFrame from '@/components/LogoFrame';
import PlatformLanding from '@/components/PlatformLanding';
import TuBarberCredit from '@/components/TuBarberCredit';
import TenantPublicBackground from '@/components/TenantPublicBackground';
import TenantSiteShell from '@/components/TenantSiteShell';
import { assertTenantExists, getTenantFromHeaders } from '@/lib/tenant/context';
import { resolveTenantBranding } from '@/lib/tenant/branding';
import { getActiveBarbershopsForShowcase } from '@/lib/tenant/public-directory';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await assertTenantExists();
  const tenant = await getTenantFromHeaders();

  if (!tenant) {
    const barbershops = await getActiveBarbershopsForShowcase();
    return <PlatformLanding barbershops={barbershops} />;
  }

  if (tenant.status !== 'active') {
    redirect(`/tenant-status?status=${tenant.status}`);
  }

  const db = scopedPrisma(tenant.id);
  const barbers = await db.user.findMany({
    where: { role: { in: ['barbero', 'dueno'] }, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, photo: true },
  });

  const settings = await db.settings.findUnique();
  const branding = resolveTenantBranding(settings);

  const barberList = barbers.map((b) => ({
    id: b.id,
    name: b.name,
    image: b.photo?.trim() || null,
  }));

  return (
    <TenantSiteShell branding={branding} className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      <TenantPublicBackground url={branding.backgroundUrl} />

      {barberList.length > 0 && (
        <div className="absolute left-0 right-0 z-20 text-center pointer-events-none animate-slide-in-bottom animation-delay-600 bottom-[12dvh] sm:bottom-[10dvh] md:hidden">
          <BarberSelectionText barberCount={barberList.length} />
        </div>
      )}

      <main
        className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <header className="flex shrink-0 w-full flex-col items-center justify-center pt-4 pb-3 sm:py-4 md:pt-3 md:pb-4 lg:pb-5">
          {branding.logoUrl ? (
            <LogoFrame
              src={branding.logoUrl}
              alt={tenant.name}
              size="landing"
              priority
              className="mb-1 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
            />
          ) : (
            <h1 className="mx-auto max-w-md text-center text-2xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] sm:text-3xl md:text-4xl animate-slide-in-top animation-delay-200">
              {tenant.name}
            </h1>
          )}
        </header>

        {barberList.length > 0 ? (
          <BarberCarousel barbers={barberList} />
        ) : (
          <div className="flex flex-1 items-center justify-center animate-fade-in animation-delay-500">
            <p className="text-white/60 text-lg">No hay barberos disponibles</p>
          </div>
        )}
      </main>
      <TuBarberCredit fixed />
    </TenantSiteShell>
  );
}
