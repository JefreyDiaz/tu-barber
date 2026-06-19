import Link from 'next/link';

export default async function TenantStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const messages: Record<string, { title: string; body: string }> = {
    pending: {
      title: 'Barbería en revisión',
      body: 'Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando esté activa.',
    },
    suspended: {
      title: 'Barbería suspendida',
      body: 'Esta barbería ha sido suspendida. Contacta al administrador de la plataforma.',
    },
    rejected: {
      title: 'Solicitud rechazada',
      body: 'Tu solicitud de registro no fue aprobada.',
    },
  };

  const info = messages[status ?? 'pending'] ?? messages.pending;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">{info.title}</h1>
      <p className="mt-2 max-w-md text-neutral-600">{info.body}</p>
      <Link href="/" className="mt-6 text-sm font-medium text-neutral-800 underline">
        Ir a TuBarber
      </Link>
    </div>
  );
}
