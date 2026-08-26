'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PlatformLogo from '@/components/PlatformLogo';
import PasswordInput from '@/components/PasswordInput';
import { tenantApiUrl } from '@/lib/tenant/client-api';

interface ChangePasswordFormProps {
  tenantName?: string;
  tenantDisplayHost?: string;
}

export default function ChangePasswordForm({
  tenantName,
  tenantDisplayHost,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(tenantApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        setError(json.error ?? 'No se pudo actualizar la contraseña');
        setLoading(false);
        return;
      }

      await update({ mustChangePassword: false });
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  return (
    <div className="platform-bg flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="max-w-xs text-2xl font-bold leading-tight tracking-tight text-white sm:max-w-md sm:text-3xl">
          {tenantName ?? 'Mi Barbería'}
        </h1>
        <p className="mt-2 text-sm text-white/45">Actualiza tu contraseña para continuar</p>
        {tenantDisplayHost && (
          <p className="mt-1 font-mono text-xs text-amber-400/70">{tenantDisplayHost}</p>
        )}
      </div>

      <div className="glass-card-strong w-full max-w-md p-8 animate-scale-in">
        <h2 className="mb-1 text-center text-xl font-bold text-white">Nueva contraseña</h2>
        <p className="mb-6 text-center text-sm text-white/45">
          Por seguridad, debes cambiar la contraseña temporal antes de usar el panel.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-white/75">
              Nueva contraseña
            </label>
            <PasswordInput
              id="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium text-white/75"
            >
              Confirmar contraseña
            </label>
            <PasswordInput
              id="confirm-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full rounded-2xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>

      <div className="mt-8 opacity-50">
        <PlatformLogo size="sm" href="/" />
      </div>
    </div>
  );
}
