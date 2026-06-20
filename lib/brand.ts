/** TuBarber platform brand assets (not tenant-configurable). */
export const PLATFORM_LOGO = {
  /** Horizontal logo for dark backgrounds — recommended 800×176 px (@2x) or 400×88 (@1x). */
  logo: '/brand/tubarber-logo.png',
  /** Compact header variant — optional, falls back to `logo`. */
  logoSm: '/brand/tubarber-logo-sm.png',
  /** Mark for favicon / PWA — served from `public/brand/tubarber-icon.png`. */
  icon: '/brand/tubarber-icon.png',
} as const;

export const PLATFORM_LOGO_ALT = 'TuBarber';

/** PWA / add-to-home-screen icons (browser scales to requested size). */
export const PLATFORM_PWA_ICONS = [
  { src: PLATFORM_LOGO.icon, sizes: '192x192', type: 'image/png' as const },
  { src: PLATFORM_LOGO.icon, sizes: '512x512', type: 'image/png' as const },
  {
    src: PLATFORM_LOGO.icon,
    sizes: '512x512',
    type: 'image/png' as const,
    purpose: 'maskable' as const,
  },
] as const;
