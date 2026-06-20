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

  if (platformLogin) {
    return (
      <div className="platform-bg flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tu<span className="text-gradient-gold">Barber</span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-white/45">Panel de administración de plataforma</p>
        </div>

        <div className="glass-card-strong w-full max-w-md p-8 animate-scale-in">
          <h2 className="mb-1 text-center text-xl font-bold text-white">Iniciar sesión</h2>
          <p className="mb-6 text-center text-sm text-white/45">Acceso super-admin</p>

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
                placeholder="superadmin"
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
            <Link href="/" className="text-sm text-white/45 hover:text-amber-400/90">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
        <source src="/video/fondos/fondo-1.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4">
        <Link href="/" className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-[0.12em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] sm:text-4xl">
            {tenantName ?? 'BarBot'}
          </h1>
        </Link>

        <div className="w-full max-w-md rounded-2xl bg-white/10 p-8 backdrop-blur-md">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-white/80">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Tu nombre de usuario"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 font-semibold text-neutral-900 transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-white/60 hover:text-white/80">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
