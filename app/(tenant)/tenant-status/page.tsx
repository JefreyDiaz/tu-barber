import Link from 'next/link';
import PlatformLogo from '@/components/PlatformLogo';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { buildPlatformOrigin } from '@/lib/tenant/urls';

const STATUS_CONTENT: Record<
  string,
  { title: string; body: string; accent: string }
> = {
  pending: {
    title: 'Barbería en revisión',
    body: 'Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando esté activa.',
    accent: 'text-amber-400/90',
  },
  suspended: {
    title: 'Barbería suspendida',
    body: 'Esta barbería no está disponible en este momento. Si eres el dueño, contacta a TuBarber para reactivar tu cuenta o regularizar tu suscripción.',
    accent: 'text-red-400/90',
  },
  rejected: {
    title: 'Solicitud rechazada',
    body: 'Tu solicitud de registro no fue aprobada. Si crees que es un error, escríbenos a soporte.',
    accent: 'text-orange-400/90',
  },
};

export default async function TenantStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tenant = await getTenantFromHeaders();
  const info = STATUS_CONTENT[status ?? 'pending'] ?? STATUS_CONTENT.pending;
  const platformUrl = buildPlatformOrigin();

  return (
    <div className="platform-bg flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 text-center text-white">
      <div className="glass-card-strong w-full max-w-md p-8 animate-scale-in">
        <PlatformLogo size="md" href={platformUrl} className="mx-auto" />

        <p className={`mt-6 text-sm font-semibold uppercase tracking-wider ${info.accent}`}>
          {tenant?.name ?? 'TuBarber'}
        </p>

        <h1 className="mt-3 text-xl font-bold sm:text-2xl">{info.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{info.body}</p>

        <Link
          href={platformUrl}
          className="btn-accent mt-8 inline-block rounded-2xl px-6 py-3 text-sm font-semibold"
        >
          Ir a TuBarber
        </Link>
      </div>
    </div>
  );
}
