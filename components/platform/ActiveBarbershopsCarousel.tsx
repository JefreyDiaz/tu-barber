'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ShowcaseBarbershop } from '@/lib/tenant/public-directory';

interface ActiveBarbershopsCarouselProps {
  readonly shops: readonly ShowcaseBarbershop[];
}

function ShopCard({ shop }: { shop: ShowcaseBarbershop }) {
  const initial = shop.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Link
      href={shop.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ir al sitio de ${shop.name}`}
      className="group flex w-[140px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition-all duration-300 hover:border-amber-400/35 hover:bg-amber-400/[0.06] hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] sm:w-[156px]"
    >
      <div className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-xl bg-stone-900/80 ring-1 ring-white/10 transition-all group-hover:ring-amber-400/40 sm:h-20 sm:w-20">
        {shop.logoUrl ? (
          <Image
            src={shop.logoUrl}
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-contain p-2"
            unoptimized={shop.logoUrl.includes('?v=')}
          />
        ) : (
          <span className="text-2xl font-bold text-amber-400/90">{initial}</span>
        )}
      </div>
      <p className="line-clamp-2 text-center text-sm font-semibold leading-snug text-white/85 transition-colors group-hover:text-amber-100">
        {shop.name}
      </p>
    </Link>
  );
}

export default function ActiveBarbershopsCarousel({ shops }: ActiveBarbershopsCarouselProps) {
  if (shops.length === 0) return null;

  const expanded: ShowcaseBarbershop[] = [];
  while (expanded.length < Math.max(8, shops.length * 2)) {
    expanded.push(...shops);
  }
  const loopItems = [...expanded, ...expanded];

  return (
    <section className="py-8 sm:py-10" aria-labelledby="barbershops-showcase-heading">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/75">
          Barberías activas
        </p>
        <h2 id="barbershops-showcase-heading" className="mt-2 text-xl font-bold sm:text-2xl">
          Encuentra tu barbería
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
          Reserva directamente en el sitio de tu barbería favorita
        </p>
      </div>

      <div className="relative mt-8 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0c0a09] to-transparent sm:w-20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#0c0a09] to-transparent sm:w-20"
          aria-hidden
        />

        <div className="barbershops-marquee flex w-max gap-4 px-2 sm:gap-5">
          {loopItems.map((shop, index) => (
            <ShopCard key={`${shop.slug}-${index}`} shop={shop} />
          ))}
        </div>
      </div>
    </section>
  );
}
