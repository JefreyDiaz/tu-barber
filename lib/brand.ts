/** TuBarber platform brand assets (not tenant-configurable). */
export const PLATFORM_LOGO = {
  /** Horizontal logo for dark backgrounds — recommended 800×176 px (@2x) or 400×88 (@1x). */
  logo: '/brand/tubarber-logo.png',
  /** Compact header variant — optional, falls back to `logo`. */
  logoSm: '/brand/tubarber-logo-sm.png',
  /** Square mark for favicon / PWA — optional 512×512 px. */
  icon: '/brand/tubarber-icon.png',
} as const;

export const PLATFORM_LOGO_ALT = 'TuBarber';
