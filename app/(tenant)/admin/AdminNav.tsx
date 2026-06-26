'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type AdminNavProps = {
  tq: string;
  isSetupMode: boolean;
  role?: string;
  multiBarberPlan: boolean;
};

const CONFIG_PATHS = [
  '/admin/perfil',
  '/admin/users',
  '/admin/services',
  '/admin/horarios',
  '/admin/config',
  '/admin/apariencia',
];

function navClass(isActive: boolean): string {
  return [
    'rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-500/35'
      : 'text-white/55 hover:bg-white/8 hover:text-white/85',
  ].join(' ');
}

function isPathActive(pathname: string, href: string): boolean {
  const path = href.split('?')[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AdminNav({ tq, isSetupMode, role, multiBarberPlan }: AdminNavProps) {
  const pathname = usePathname();
  const [configOpen, setConfigOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwnerOrAdmin = role === 'admin' || role === 'dueno';
  const isBarber = role === 'barbero' || role === 'dueno';

  const showMisReservas = !isSetupMode && isBarber;
  const showAllReservas = !isSetupMode && isOwnerOrAdmin && multiBarberPlan;

  const configItems = [
    {
      href: '/admin/perfil',
      label: 'Mi perfil',
      show: !!role && !isSetupMode,
    },
    {
      href: '/admin/horarios',
      label: 'Horarios',
      show: !isSetupMode && isBarber,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      show: multiBarberPlan && (isSetupMode || isOwnerOrAdmin),
    },
    {
      href: '/admin/services',
      label: 'Servicios',
      show: !isSetupMode && isOwnerOrAdmin,
    },
    {
      href: '/admin/apariencia',
      label: 'Apariencia del sitio',
      show: !isSetupMode && isOwnerOrAdmin,
    },
    {
      href: '/admin/config',
      label: 'Ajustes avanzados',
      show: !isSetupMode && isOwnerOrAdmin,
    },
  ].filter((item) => item.show);

  const isConfigActive = CONFIG_PATHS.some((path) => isPathActive(pathname, path));

  useEffect(() => {
    if (!configOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfigOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [configOpen]);

  return (
    <nav className="mt-3 flex flex-wrap items-center gap-1.5">
      {showMisReservas && (
        <Link
          href={`/admin/mis-reservas${tq}`}
          className={navClass(isPathActive(pathname, '/admin/mis-reservas'))}
        >
          Mis reservas
        </Link>
      )}

      {showAllReservas && (
        <Link
          href={`/admin/bookings${tq}`}
          className={navClass(isPathActive(pathname, '/admin/bookings'))}
        >
          Reservas
        </Link>
      )}

      {configItems.length > 0 && (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            aria-expanded={configOpen}
            aria-haspopup="menu"
            className={`inline-flex items-center gap-1.5 ${navClass(isConfigActive || configOpen)}`}
          >
            Configuración
            <ChevronIcon open={configOpen} />
          </button>

          {configOpen && (
            <div
              role="menu"
              className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-[13rem] w-max max-w-[min(100vw-2rem,16rem)]"
            >
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-stone-950 py-1 shadow-2xl shadow-black/70">
                {configItems.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={`${item.href}${tq}`}
                      role="menuitem"
                      onClick={() => setConfigOpen(false)}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-amber-500/20 font-medium text-amber-100'
                          : 'text-white/90 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
