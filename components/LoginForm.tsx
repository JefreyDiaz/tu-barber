'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoginFormProps {
  tenantId?: string | null;
  tenantSlug?: string | null;
  tenantName?: string;
  platformLogin?: boolean;
}

export function LoginForm({ tenantId, tenantSlug, tenantName, platformLogin = false }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const homeHref = tenantSlug ? `/?tenant=${encodeURIComponent(tenantSlug)}` : '/';

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

      const adminPath = tenantSlug ? `/admin?tenant=${encodeURIComponent(tenantSlug)}` : '/admin';
      router.push(platformLogin ? '/platform/tenants' : adminPath);
      router.refresh();
    } catch {
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="platform-bg flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        {platformLogin ? (
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tu<span className="text-gradient-gold">Barber</span>
            </h1>
          </Link>
        ) : (
          <Link href={homeHref} className="inline-block">
            <h1 className="max-w-xs text-2xl font-bold leading-tight tracking-tight text-white sm:max-w-md sm:text-3xl">
              {tenantName ?? 'Mi Barbería'}
            </h1>
          </Link>
        )}
        <p className="mt-2 text-sm text-white/45">
          {platformLogin ? 'Panel de administración de plataforma' : 'Panel de administración'}
        </p>
        {!platformLogin && tenantSlug && (
          <p className="mt-1 font-mono text-xs text-amber-400/70">{tenantSlug}.tubarber.com</p>
        )}
      </div>

      <div className="glass-card-strong w-full max-w-md p-8 animate-scale-in">
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
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/75">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm"
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

        <div className="mt-6 text-center">
          <Link
            href={platformLogin ? '/' : homeHref}
            className="text-sm text-white/45 hover:text-amber-400/90"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
