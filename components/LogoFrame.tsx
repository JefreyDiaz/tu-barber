import Image from 'next/image';
import { LOGO_PILL_CLASS, logoFrameClassName, type LogoFrameSize } from '@/lib/logo-frame';

type LogoFrameProps = {
  src: string;
  alt: string;
  size?: LogoFrameSize;
  className?: string;
  priority?: boolean;
};

/** Horizontal pill frame for barbershop logos. */
export default function LogoFrame({
  src,
  alt,
  size = 'landing',
  className = '',
  priority = false,
}: Readonly<LogoFrameProps>) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.45)] ${LOGO_PILL_CLASS} ${logoFrameClassName(size)} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="scale-[1.06] object-cover"
        sizes="(max-width: 768px) 220px, 320px"
        priority={priority}
        unoptimized={src.includes('?v=') || src.startsWith('blob:')}
      />
    </div>
  );
}
