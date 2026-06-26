'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

interface Barber {
  id: string;
  name: string;
  image: string;
}

interface BarberCarouselProps {
  readonly barbers: readonly Barber[];
}

export default function BarberCarousel({ barbers }: BarberCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isSingleBarber = barbers.length === 1;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setScrollLeft(el.scrollLeft);
      setContainerWidth(el.clientWidth);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    // Activar animaciones de entrada después de montar
    const timer = setTimeout(() => setIsLoaded(true), 50);

    // Activar animación de swipe hint después de que los elementos aparezcan
    // Solo si hay más de un barbero
    let swipeTimer: NodeJS.Timeout | undefined;
    if (!isSingleBarber) {
      swipeTimer = setTimeout(() => {
        setShowSwipeHint(true);
      }, 800); // Esperar a que las animaciones de entrada terminen
    }

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      clearTimeout(timer);
      if (swipeTimer) clearTimeout(swipeTimer);
    };
  }, [isSingleBarber]);

  // Detectar cuando el usuario interactúa con el carrusel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || hasInteracted) return;

    const handleInteraction = () => {
      setHasInteracted(true);
      setShowSwipeHint(false);
    };

    el.addEventListener('touchstart', handleInteraction, { passive: true });
    el.addEventListener('mousedown', handleInteraction);

    return () => {
      el.removeEventListener('touchstart', handleInteraction);
      el.removeEventListener('mousedown', handleInteraction);
    };
  }, [hasInteracted]);

  return (
    <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden overscroll-x-contain snap-x snap-mandatory scroll-smooth md:flex-initial md:mt-4 md:min-h-0 lg:mt-5"
      ref={scrollRef}
    >
      <div 
        className={`flex h-full min-h-[50vh] md:min-h-0 md:h-auto w-max min-w-full items-end justify-center gap-4 px-4 pb-4 md:gap-6 md:px-6 md:pb-6 md:pt-0 lg:gap-8 lg:px-8 lg:pb-8 ${showSwipeHint && !hasInteracted ? 'animate-swipe-hint' : ''}`}
      >
        {barbers.map((barber, index) => (
          <BarberSlide
            key={barber.id}
            barber={barber}
            index={index}
            scrollLeft={scrollLeft}
            containerWidth={containerWidth}
            scrollRef={scrollRef}
            isLoaded={isLoaded}
          />
        ))}
      </div>
    </div>
  );
}

// Componente para el texto indicador (se usa en page.tsx)
export function BarberSelectionText({ barberCount }: { readonly barberCount: number }) {
  const isSingleBarber = barberCount === 1;

  return (
    <>
      {isSingleBarber ? (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 animate-bounce-gentle">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-white/80">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
            <p className="text-white/80 text-sm sm:text-base font-medium drop-shadow-md">
              Toca la imagen para reservar
            </p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-white/80">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </div>
          <p className="text-white text-lg sm:text-xl font-semibold tracking-wide animate-text-glow drop-shadow-lg">
            ¡Tu barbero te espera!
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-white text-lg sm:text-xl font-semibold tracking-wide drop-shadow-lg">
            Elige tu barbero y reserva
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-white/60 text-base animate-arrow-pulse drop-shadow-md">◀</span>
            <p className="text-white/70 text-sm sm:text-base drop-shadow-md">
              Desliza y toca para agendar
            </p>
            <span className="text-white/60 text-base animate-arrow-pulse drop-shadow-md" style={{ animationDelay: '0.2s' }}>▶</span>
          </div>
        </div>
      )}
    </>
  );
}


interface BarberSlideProps {
  readonly barber: Barber;
  readonly index: number;
  readonly scrollLeft: number;
  readonly containerWidth: number;
  readonly scrollRef: React.RefObject<HTMLDivElement | null>;
  readonly isLoaded: boolean;
}

function BarberSlide({ barber, index, scrollLeft, containerWidth, scrollRef, isLoaded }: BarberSlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [slideLeft, setSlideLeft] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    const slide = slideRef.current;
    if (!container || !slide) return;

    const update = () => {
      const rect = slide.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setSlideLeft(rect.left - containerRect.left + container.scrollLeft);
      setSlideWidth(rect.width);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(slide);
    container.addEventListener('scroll', update, { passive: true });

    return () => {
      ro.disconnect();
      container.removeEventListener('scroll', update);
    };
  }, [scrollRef, scrollLeft]);

  // Qué tan centrado está este slide (0 = fuera, 1 = centrado)
  const centerX = slideLeft + slideWidth / 2;
  const containerCenter = scrollLeft + containerWidth / 2;
  const distance = Math.abs(centerX - containerCenter);
  // Evitar división por 0 cuando containerWidth aún no está medido
  const focus = containerWidth > 0 
    ? Math.max(0, 1 - distance / (containerWidth * 0.6))
    : 1; // Mostrar completamente visible mientras se mide

  const scale = 0.88 + 0.12 * focus;
  const opacity = 0.72 + 0.28 * focus;

  // Delay escalonado para animación de entrada (cada barbero aparece 100ms después)
  const entryDelay = index * 100;

  return (
    <div
      ref={slideRef}
      className="relative flex h-full min-w-[70vw] shrink-0 snap-center items-end justify-center md:min-w-[240px] lg:min-w-[280px] xl:min-w-[320px]"
      style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${entryDelay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${entryDelay}ms`,
      }}
    >
      <Link
        href={`/booking/${barber.id}`}
        className="relative flex h-full max-h-[55vh] w-full items-end justify-center cursor-pointer touch-manipulation md:max-h-[50vh] lg:max-h-[55vh]"
        style={{
          transform: `scale(${scale})`,
          opacity,
          transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s ease-out',
        }}
      >
        <Image
          src={barber.image}
          alt={barber.name}
          width={350}
          height={500}
          className="h-full w-auto max-h-[55vh] object-contain object-bottom drop-shadow-[0_0_40px_rgba(0,0,0,0.5)] md:max-h-[50vh] lg:max-h-[55vh]"
          priority={index === 0}
        />
      </Link>
    </div>
  );
}
