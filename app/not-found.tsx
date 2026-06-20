import Link from 'next/link';
import PlatformLogo from '@/components/PlatformLogo';

export default function NotFound() {
  return (
    <div className="platform-bg flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 text-center text-white">
      <div className="glass-card-strong w-full max-w-md p-8 animate-scale-in">
        <PlatformLogo size="md" href="/" className="mx-auto" />
        <p className="mt-6 text-5xl font-bold text-amber-400/90">404</p>
        <h1 className="mt-4 text-xl font-bold sm:text-2xl">Barbería no encontrada</h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">
          El subdominio o enlace que intentas acceder no existe en TuBarber.
        </p>
        <Link
          href="/"
          className="btn-accent mt-6 inline-block rounded-2xl px-6 py-3 text-sm font-semibold"
        >
          Ir a TuBarber
        </Link>
      </div>
    </div>
  );
}
