'use client';

import Link from 'next/link';
import LogoFrame from '@/components/LogoFrame';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ShowcaseBarbershop } from '@/lib/tenant/showcase';
import { BARBERSHOPS_SECTION_HASH, BARBERSHOPS_SECTION_ID } from '@/lib/tenant/showcase';

interface ActiveBarbershopsCarouselProps {
  readonly shops: readonly ShowcaseBarbershop[];
}

function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchesShop(shop: ShowcaseBarbershop, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return (
    normalizeSearch(shop.name).includes(q) ||
    normalizeSearch(shop.slug).includes(q) ||
    shop.slug.replace(/-/g, ' ').includes(q)
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ShopCard({
  shop,
  compact,
}: {
  readonly shop: ShowcaseBarbershop;
  readonly compact?: boolean;
}) {
  const initial = shop.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Link
      href={shop.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ir al sitio de ${shop.name}`}
      className={`group flex shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition-all duration-300 hover:border-amber-400/35 hover:bg-amber-400/[0.06] hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] ${
        compact ? 'w-[132px] snap-start' : 'w-full'
      }`}
    >
      <div className="relative flex h-10 w-24 items-center justify-center transition-all group-hover:scale-[1.02]">
        {shop.logoUrl ? (
          <LogoFrame src={shop.logoUrl} alt="" size="carousel" className="shadow-none ring-white/10 group-hover:ring-amber-400/40" />
        ) : (
          <div className="flex h-10 w-24 items-center justify-center overflow-hidden rounded-full bg-stone-900/80 ring-1 ring-white/10 transition-all group-hover:ring-amber-400/40">
            <span className="text-xl font-bold text-amber-400/90">{initial}</span>
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-center text-sm font-semibold leading-snug text-white/85 transition-colors group-hover:text-amber-100">
        {shop.name}
      </p>
    </Link>
  );
}

function SearchResultCard({ shop }: { readonly shop: ShowcaseBarbershop }) {
  const initial = shop.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Link
      href={shop.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3 transition-all hover:border-amber-400/35 hover:bg-amber-400/[0.06]"
    >
      <div className="flex h-10 w-24 shrink-0 items-center justify-center">
        {shop.logoUrl ? (
          <LogoFrame src={shop.logoUrl} alt="" size="carousel" className="shadow-none ring-white/10" />
        ) : (
          <div className="flex h-10 w-24 items-center justify-center overflow-hidden rounded-full bg-stone-900/80 ring-1 ring-white/10">
            <span className="text-lg font-bold text-amber-400/90">{initial}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white/90 group-hover:text-amber-100">{shop.name}</p>
        <p className="truncate text-xs text-white/40">{shop.slug.replace(/-/g, ' ')}</p>
      </div>
      <span className="shrink-0 text-sm text-amber-400/80 transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

function splitIntoRows(shops: readonly ShowcaseBarbershop[]): [ShowcaseBarbershop[], ShowcaseBarbershop[]] {
  const row1: ShowcaseBarbershop[] = [];
  const row2: ShowcaseBarbershop[] = [];
  for (const [index, shop] of shops.entries()) {
    if (index % 2 === 0) row1.push(shop);
    else row2.push(shop);
  }
  return [row1, row2];
}

function buildMarqueeTrack(rowShops: readonly ShowcaseBarbershop[]): ShowcaseBarbershop[] {
  if (rowShops.length === 0) return [];
  const segment: ShowcaseBarbershop[] = [];
  while (segment.length < Math.max(6, rowShops.length * 2)) {
    segment.push(...rowShops);
  }
  return [...segment, ...segment];
}

function resumeMarqueeAnimations(): void {
  for (const el of document.querySelectorAll<HTMLElement>(
    '.barbershops-marquee-left, .barbershops-marquee-right'
  )) {
    const animation = globalThis.getComputedStyle(el).animation;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = animation;
    el.style.animationPlayState = 'running';
  }
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
    <div className="barbershops-row relative w-full min-w-0 overflow-hidden py-1">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0c0a09] to-transparent sm:w-14"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0c0a09] to-transparent sm:w-14"
        aria-hidden
      />
      <div className={`${animationClass} barbershops-marquee-track flex w-max gap-3 px-3 sm:gap-4 sm:px-4`}>
        {track.map((shop, index) => (
          <ShopCard key={`${rowKey}-${shop.slug}-${index}`} shop={shop} compact />
        ))}
      </div>
    </div>
  );
}

function CarouselRows({ shops }: { readonly shops: readonly ShowcaseBarbershop[] }) {
  const [row1, row2] = splitIntoRows(shops);
  const singleRow = row2.length === 0;

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-4">
      <MarqueeRow shops={row1} direction="right" rowKey="r1" />
      {!singleRow && <MarqueeRow shops={row2} direction="left" rowKey="r2" />}
    </div>
  );
}

export default function ActiveBarbershopsCarousel({ shops }: ActiveBarbershopsCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (globalThis.window?.location.hash !== BARBERSHOPS_SECTION_HASH) return;

    const timer = globalThis.window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    return () => globalThis.window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) resumeMarqueeAnimations();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') resumeMarqueeAnimations();
    }

    globalThis.window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      globalThis.window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = globalThis.window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => globalThis.window.clearTimeout(timer);
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  function openSearch() {
    setSearchOpen(true);
  }

  const filtered = useMemo(
    () => shops.filter((shop) => matchesShop(shop, query)),
    [shops, query]
  );

  const hasQuery = query.trim().length > 0;
  const showResults = searchOpen && hasQuery;
  const showCarousel = !searchOpen;

  if (shops.length === 0) return null;

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

      <div className="mt-6 flex flex-col items-center px-2">
        {!searchOpen ? (
          <button
            type="button"
            onClick={openSearch}
            className="btn-glass inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium text-white/75 transition-all hover:border-amber-400/30 hover:text-amber-100"
            aria-expanded={false}
            aria-controls="barbershop-search-panel"
          >
            <SearchIcon />
            Buscar barbería
          </button>
        ) : (
          <div
            id="barbershop-search-panel"
            className="relative w-full max-w-md animate-fade-in"
          >
            <label htmlFor="barbershop-search" className="sr-only">
              Buscar barbería
            </label>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/70">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              id="barbershop-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeSearch();
              }}
              placeholder="Buscar por nombre..."
              autoComplete="off"
              enterKeyHint="search"
              className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-10 text-sm ring-1 ring-amber-400/20"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
              aria-label="Cerrar búsqueda"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        {showResults ? (
          filtered.length > 0 ? (
            <ul className="mx-auto max-w-lg space-y-2 px-2 animate-fade-in">
              {filtered.map((shop) => (
                <li key={shop.slug}>
                  <SearchResultCard shop={shop} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="glass-card mx-auto max-w-md px-4 py-8 text-center animate-fade-in">
              <p className="text-sm font-medium text-white/70">No encontramos esa barbería</p>
              <p className="mt-1 text-xs text-white/45">
                Prueba con otro nombre o revisa cómo aparece en TuBarber
              </p>
            </div>
          )
        ) : searchOpen ? (
          <p className="text-center text-xs text-white/40 animate-fade-in">
            Escribe el nombre de tu barbería
          </p>
        ) : null}

        {showCarousel && (
          <div className="w-full min-w-0">
            <CarouselRows shops={shops} />
          </div>
        )}
      </div>
    </section>
  );
}
