'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function ImpersonateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Enlace inválido o incompleto.');
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await signIn('credentials', {
        impersonateToken: token,
        redirect: false,
      });

      if (cancelled) return;

      if (result?.error) {
        setError('El enlace expiró o ya no es válido. Vuelve al panel de plataforma e intenta de nuevo.');
        return;
      }

      router.replace('/admin');
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="platform-bg flex min-h-screen min-h-[100dvh] items-center justify-center px-4">
        <div className="glass-card-strong max-w-md p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <Link href="/login" className="btn-glass mt-4 inline-block rounded-xl px-4 py-2 text-sm">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="platform-bg flex min-h-screen min-h-[100dvh] items-center justify-center px-4">
      <div className="glass-card-strong max-w-md p-6 text-center">
        <p className="text-sm text-white/70">Iniciando sesión de soporte…</p>
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense
      fallback={
        <div className="platform-bg flex min-h-screen min-h-[100dvh] items-center justify-center px-4">
          <p className="text-sm text-white/70">Cargando…</p>
        </div>
      }
    >
      <ImpersonateContent />
    </Suspense>
  );
}
