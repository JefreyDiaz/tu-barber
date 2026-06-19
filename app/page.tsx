import BarberCarousel, { BarberSelectionText } from '@/components/BarberCarousel';
import PlatformLanding from '@/components/PlatformLanding';
import Image from 'next/image';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const tenant = await getTenantFromHeaders();

  if (!tenant) {
    return <PlatformLanding />;
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

  const barberList = barbers.map((b) => ({
    id: b.id,
    name: b.name,
    image: b.photo || '/image/barberos/default.png',
  }));

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover animate-fade-in">
        <source src="/video/fondos/fondo-1.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />

      {barberList.length > 0 && (
        <div className="absolute left-0 right-0 z-20 text-center pointer-events-none animate-slide-in-bottom animation-delay-600 bottom-[12dvh] sm:bottom-[10dvh] md:hidden">
          <BarberSelectionText barberCount={barberList.length} />
        </div>
      )}

      <main
        className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <header className="flex shrink-0 w-full items-center justify-center pt-3 pb-1 sm:py-3 md:pt-2 md:pb-0">
          {settings?.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={tenant.name}
              width={500}
              height={210}
              className="mx-auto h-auto w-[280px] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] sm:w-[320px] md:w-[380px]"
              priority
            />
          ) : (
            <Image
              src="/image/logo/logo_barber.png"
              alt={tenant.name}
              width={500}
              height={210}
              className="mx-auto h-auto w-[280px] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] sm:w-[320px] md:w-[380px] lg:w-[440px] xl:w-[500px] animate-slide-in-top animation-delay-200"
              priority
            />
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
    </div>
  );
}
