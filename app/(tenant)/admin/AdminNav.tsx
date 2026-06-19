'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AdminNavProps = {
  tq: string;
  isSetupMode: boolean;
  role?: string;
};

function navClass(pathname: string, href: string): string {
  const path = href.split('?')[0];
  const isActive = pathname === path || pathname.startsWith(`${path}/`);
  return [
    'shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-neutral-200 text-neutral-900 shadow-sm'
      : 'text-neutral-600 hover:bg-neutral-100',
  ].join(' ');
}

export function AdminNav({ tq, isSetupMode, role }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 mt-2 -mb-px overflow-x-auto">
      {role && !isSetupMode && (
        <Link href={`/admin/perfil${tq}`} className={navClass(pathname, '/admin/perfil')}>
          Mi perfil
        </Link>
      )}
      {(isSetupMode || role === 'admin' || role === 'dueno') && (
        <Link href={`/admin/users${tq}`} className={navClass(pathname, '/admin/users')}>
          Usuarios
        </Link>
      )}
      {!isSetupMode && (role === 'admin' || role === 'dueno') && (
        <>
          <Link href={`/admin/services${tq}`} className={navClass(pathname, '/admin/services')}>
            Servicios
          </Link>
          <Link href={`/admin/bookings${tq}`} className={navClass(pathname, '/admin/bookings')}>
            Reservas
          </Link>
        </>
      )}
      {!isSetupMode && (role === 'barbero' || role === 'dueno') && (
        <Link href={`/admin/mis-reservas${tq}`} className={navClass(pathname, '/admin/mis-reservas')}>
          Mis Reservas
        </Link>
      )}
      {!isSetupMode && (role === 'barbero' || role === 'dueno') && (
        <Link href={`/admin/horarios${tq}`} className={navClass(pathname, '/admin/horarios')}>
          Horarios
        </Link>
      )}
      {!isSetupMode && (role === 'admin' || role === 'dueno') && (
        <Link href={`/admin/config${tq}`} className={navClass(pathname, '/admin/config')}>
          Configuración
        </Link>
      )}
    </nav>
  );
}
