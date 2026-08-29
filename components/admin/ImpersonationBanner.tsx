'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { buildPlatformOrigin } from '@/lib/tenant/urls';

export function ImpersonationBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exitImpersonation() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/stop-impersonation', { method: 'POST' });
      const data = (await res.json()) as { success?: boolean; restoreToken?: string; error?: string };

      if (!res.ok || !data.restoreToken) {
        setError(data.error ?? 'No se pudo salir del modo suplantación');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        restoreToken: data.restoreToken,
        redirect: false,
      });

      if (result?.error) {
        setError('No se pudo restaurar la sesión de plataforma');
        setLoading(false);
        return;
      }

      window.location.href = `${buildPlatformOrigin()}/platform/tenants`;
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-amber-100">
          Modo suplantación — Estás viendo el admin como soporte de plataforma
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-300">{error}</span>}
          <button
            type="button"
            onClick={() => void exitImpersonation()}
            disabled={loading}
            className="rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-50 disabled:opacity-50"
          >
            {loading ? 'Saliendo…' : 'Salir de suplantación'}
          </button>
        </div>
      </div>
    </div>
  );
}
