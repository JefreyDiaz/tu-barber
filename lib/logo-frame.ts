/** Horizontal pill (capsule) used for barbershop logos — distinct from circular barber photos. */
export const LOGO_OVAL_ASPECT = 2.5;

export const LOGO_EXPORT_WIDTH = 500;
export const LOGO_EXPORT_HEIGHT = 200;

/** Tailwind class for the horizontal pill shape (flat top/bottom, round ends). */
export const LOGO_PILL_CLASS = 'rounded-full';

/** Slight bleed so the image fully covers the pill edge (avoids transparent gaps). */
export const LOGO_COVER_BLEED = 1.04;

export type LogoFrameSize = 'landing' | 'admin' | 'preview' | 'carousel' | 'platform';

const FRAME_CLASSES: Record<LogoFrameSize, string> = {
  landing:
    'h-[88px] w-[220px] sm:h-[104px] sm:w-[260px] md:h-[120px] md:w-[300px] lg:h-[128px] lg:w-[320px]',
  admin: 'h-8 w-20 sm:h-9 sm:w-[4.5rem]',
  preview: 'h-24 w-60',
  carousel: 'h-10 w-24',
  platform: 'h-12 w-[7.5rem] sm:h-14 sm:w-[8.75rem]',
};

export function logoFrameClassName(size: LogoFrameSize = 'landing'): string {
  return FRAME_CLASSES[size];
}
