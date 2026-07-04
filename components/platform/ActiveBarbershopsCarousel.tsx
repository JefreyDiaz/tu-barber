'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { ShowcaseBarbershop } from '@/lib/tenant/showcase';
import { BARBERSHOPS_SECTION_HASH, BARBERSHOPS_SECTION_ID } from '@/lib/tenant/showcase';

interface ActiveBarbershopsCarouselProps {
  readonly shops: readonly ShowcaseBarbershop[];
}

function ShopCard({ shop }: { readonly shop: ShowcaseBarbershop }) {
  const initial = shop.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Link
      href={shop.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ir al sitio de ${shop.name}`}
      className="group flex w-[132px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition-all duration-300 hover:border-amber-400/35 hover:bg-amber-400/[0.06] hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] sm:w-[148px]"
    >
      <div className="relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-xl bg-stone-900/80 ring-1 ring-white/10 transition-all group-hover:ring-amber-400/40 sm:h-[72px] sm:w-[72px]">
        {shop.logoUrl ? (
          <Image
            src={shop.logoUrl}
            alt=""
            width={72}
            height={72}
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

/** Split shops into two disjoint rows (no barbería appears in both). */
function splitIntoRows(shops: readonly ShowcaseBarbershop[]): [ShowcaseBarbershop[], ShowcaseBarbershop[]] {
  const row1: ShowcaseBarbershop[] = [];
  const row2: ShowcaseBarbershop[] = [];
  for (const [index, shop] of shops.entries()) {
    if (index % 2 === 0) row1.push(shop);
    else row2.push(shop);
  }
  return [row1, row2];
}

/** Build seamless loop track from a single row's unique shops only. */
function buildMarqueeTrack(rowShops: readonly ShowcaseBarbershop[]): ShowcaseBarbershop[] {
  if (rowShops.length === 0) return [];
  const segment: ShowcaseBarbershop[] = [];
  while (segment.length < Math.max(6, rowShops.length * 2)) {
    segment.push(...rowShops);
  }
  return [...segment, ...segment];
}

function MarqueeRow({
  shops,
  direction,
  rowKey,
}: {
  readonly shops: readonly ShowcaseBarbershop[];
  readonly direction: 'left' | 'right';
  readonly rowKey: string;
}) {
  if (shops.length === 0) return null;

  const track = buildMarqueeTrack(shops);
  const animationClass =
    direction === 'left' ? 'barbershops-marquee-left' : 'barbershops-marquee-right';

  return (
    <div className="relative overflow-hidden py-1">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0c0a09] to-transparent sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0c0a09] to-transparent sm:w-16"
        aria-hidden
      />
      <div className={`${animationClass} flex w-max gap-3 px-2 sm:gap-4`}>
        {track.map((shop, index) => (
          <ShopCard key={`${rowKey}-${shop.slug}-${index}`} shop={shop} />
        ))}
      </div>
    </div>
  );
}

export default function ActiveBarbershopsCarousel({ shops }: ActiveBarbershopsCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (globalThis.window?.location.hash !== BARBERSHOPS_SECTION_HASH) return;

    const timer = globalThis.window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    return () => globalThis.window.clearTimeout(timer);
  }, []);

  if (shops.length === 0) return null;

  const [rowLeft, rowRight] = splitIntoRows(shops);
  const singleRow = rowRight.length === 0;

  return (
    <section
      ref={sectionRef}
      id={BARBERSHOPS_SECTION_ID}
      className="scroll-mt-20 py-8 sm:scroll-mt-24 sm:py-10"
      aria-labelledby="barbershops-showcase-heading"
    >
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

      <div className="mt-8 space-y-3 sm:space-y-4">
        <MarqueeRow shops={rowLeft} direction="right" rowKey="r1" />
        {!singleRow && <MarqueeRow shops={rowRight} direction="left" rowKey="r2" />}
      </div>
    </section>
  );
}
