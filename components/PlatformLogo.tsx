'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PLATFORM_LOGO, PLATFORM_LOGO_ALT } from '@/lib/brand';

const SIZES = {
  sm: { width: 120, height: 30, className: 'h-7 w-auto sm:h-8', src: PLATFORM_LOGO.logoSm },
  md: { width: 180, height: 45, className: 'h-9 w-auto sm:h-11', src: PLATFORM_LOGO.logo },
  lg: { width: 220, height: 55, className: 'h-11 w-auto sm:h-14', src: PLATFORM_LOGO.logo },
} as const;

type PlatformLogoProps = {
  size?: keyof typeof SIZES;
  href?: string;
  className?: string;
  priority?: boolean;
};

export default function PlatformLogo({
  size = 'md',
  href = '/',
  className = '',
  priority = false,
}: PlatformLogoProps) {
  const { width, height, className: sizeClass, src } = SIZES[size];

  const img = (
    <Image
      src={src}
      alt={PLATFORM_LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      className={`${sizeClass} ${className}`.trim()}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="inline-block shrink-0">
      {img}
    </Link>
  );
}
