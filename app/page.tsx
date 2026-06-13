import { prisma } from "@/lib/prisma";
import BarberCarousel, { BarberSelectionText } from "@/components/BarberCarousel";
// import Link from "next/link"; // OCULTO TEMPORALMENTE - descomentar cuando se activen los botones
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Obtener usuarios con rol "barbero" o "dueno" que estén activos
  const barbers = await prisma.user.findMany({
    where: {
      role: { in: ['barbero', 'dueno'] },
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      photo: true,
    },
  });

  // Mapear a la estructura que espera el carrusel
  const barberList = barbers.map((b) => ({
    id: b.id,
    name: b.name,
    image: b.photo || '/image/barberos/default.png', // Imagen por defecto si no tiene foto
  }));

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      {/* Video de fondo - fade in */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover animate-fade-in"
      >
        <source src="/video/fondos/fondo-1.mp4" type="video/mp4" />
      </video>

      {/* Overlay con opacidad/bruma para contraste - fade in */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Texto "Elige tu barbero" - Solo visible en móvil */}
      {barberList.length > 0 && (
        <div 
          className="absolute left-0 right-0 z-20 text-center pointer-events-none animate-slide-in-bottom animation-delay-600 bottom-[12dvh] sm:bottom-[10dvh] md:hidden"
        >
          <BarberSelectionText barberCount={barberList.length} />
        </div>
      )}

      {/* Botones en esquina inferior derecha - OCULTOS TEMPORALMENTE */}
      {/* <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-2 sm:bottom-6 sm:right-6 sm:flex-row sm:gap-3">
        <Link
          href="/login"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white sm:h-12 sm:w-12 animate-slide-in-right animation-delay-700"
          title="Iniciar sesión"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 sm:h-6 sm:w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </Link>

        <Link
          href="/admin"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white sm:h-12 sm:w-12 animate-slide-in-right animation-delay-800"
          title="Panel de administración"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 sm:h-6 sm:w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </Link>
      </div> */}

      {/* Contenido principal: scroll horizontal por barberos, en primer plano */}
      <main 
        className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Logo BarberApp - slide desde arriba */}
        <header className="flex shrink-0 w-full items-center justify-center pt-3 pb-1 sm:py-3 md:pt-2 md:pb-0">
          <Image
            src="/image/logo/logo_barber.png"
            alt="BarberApp"
            width={500}
            height={210}
            className="mx-auto h-auto w-[280px] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] sm:w-[320px] md:w-[380px] lg:w-[440px] xl:w-[500px] animate-slide-in-top animation-delay-200"
            priority
          />
        </header>

        {/* Carrusel de barberos - cada barbero tiene animación escalonada */}
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
