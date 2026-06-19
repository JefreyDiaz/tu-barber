import Link from 'next/link';

export default function TenantNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">Barbería no encontrada</h1>
      <p className="mt-2 text-neutral-600">
        El subdominio o dominio que intentas acceder no existe en TuBarber.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-neutral-800 underline">
        Ir a TuBarber
      </Link>
    </div>
  );
}
