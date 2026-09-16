'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import PlatformLogo from '@/components/PlatformLogo';

const NAV_ITEMS = [
  { href: '/platform/tenants', label: 'Barberías' },
  { href: '/platform/tutorials', label: 'Tutoriales' },
] as const;

function navLinkClass(isActive: boolean): string {
  return [
    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
    isActive
      ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/40'
      : 'text-white/55 hover:bg-white/8 hover:text-white/85',
  ].join(' ');
}

export default function PlatformAdminHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-stone-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 lg:max-w-4xl">
        <div className="min-w-0">
          <PlatformLogo size="sm" href="/" />
          <p className="mt-1 text-xs text-white/45">Panel de plataforma</p>
          <nav className="mt-2 flex flex-wrap gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={navLinkClass(isActive)}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/platform/login' })}
          className="btn-glass shrink-0 rounded-full px-4 py-2 text-xs font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
