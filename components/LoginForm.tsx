'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlatformLogo from '@/components/PlatformLogo';
import PasswordInput from '@/components/PasswordInput';
import { tenantApiUrl } from '@/lib/tenant/client-api';

interface LoginFormProps {
  tenantId?: string | null;
  tenantSlug?: string | null;
  tenantName?: string;
  tenantDisplayHost?: string;
  platformLogin?: boolean;
}

type ViewMode = 'login' | 'forgot';

export function LoginForm({
  tenantId,
  tenantSlug,
  tenantName,
  tenantDisplayHost,
  platformLogin = false,
}: LoginFormProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        tenantId: tenantId ?? '',
        platformLogin: platformLogin ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        setError('Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }

      router.push(platformLogin ? '/platform/tenants' : '/admin');
      router.refresh();
    } catch {
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  };

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(tenantApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        setError(json.error ?? 'No se pudo procesar la solicitud');
        setLoading(false);
        return;
      }

      setSuccess(
        json.message ??
          'Si el correo está registrado, recibirás una contraseña temporal en unos minutos.'
      );
      setLoading(false);
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  function switchToForgot() {
    setView('forgot');
    setError(null);
    setSuccess(null);
  }

  function switchToLogin() {
    setView('login');
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="platform-bg flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        {platformLogin ? (
          <PlatformLogo size="lg" href="/" priority />
        ) : (
          <Link href="/" className="inline-block">
            <h1 className="max-w-xs text-2xl font-bold leading-tight tracking-tight text-white sm:max-w-md sm:text-3xl">
              {tenantName ?? 'Mi Barbería'}
            </h1>
          </Link>
        )}
        <p className="mt-2 text-sm text-white/45">
          {platformLogin ? 'Panel de administración de plataforma' : 'Panel de administración'}
        </p>
        {!platformLogin && tenantDisplayHost && (
          <p className="mt-1 font-mono text-xs text-amber-400/70">{tenantDisplayHost}</p>
        )}
      </div>

      <div className="glass-card-strong w-full max-w-md p-8 animate-scale-in">
        {view === 'login' ? (
          <>
            <h2 className="mb-1 text-center text-xl font-bold text-white">Iniciar sesión</h2>
            <p className="mb-6 text-center text-sm text-white/45">
              {platformLogin ? 'Acceso super-admin' : 'Dueño, admin o barbero'}
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-white/75">
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full px-4 py-3 text-sm"
                  placeholder={platformLogin ? 'superadmin' : 'Tu usuario'}
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-white/75">
                    Contraseña
                  </label>
                  {!platformLogin && (
                    <button
                      type="button"
                      onClick={switchToForgot}
                      className="text-xs text-amber-400/80 hover:text-amber-300"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full rounded-2xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-center text-xl font-bold text-white">Restablecer contraseña</h2>
            <p className="mb-6 text-center text-sm text-white/45">
              Te enviaremos una contraseña temporal al correo registrado en esta barbería.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-white/75">
                  Correo electrónico
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="glass-input w-full px-4 py-3 text-sm"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full rounded-2xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar contraseña temporal'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-sm text-white/45 hover:text-amber-400/90"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        {view === 'login' && (
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-white/45 hover:text-amber-400/90">
              ← Volver al inicio
            </Link>
          </div>
        )}
      </div>

      {!platformLogin && (
        <div className="mt-8 opacity-50">
          <PlatformLogo size="sm" href="/" />
        </div>
      )}
    </div>
  );
}
