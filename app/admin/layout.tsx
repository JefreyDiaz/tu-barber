import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignOutButton } from './SignOutButton';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;
  
  // Verificar si hay usuarios en el sistema
  const userCount = await prisma.user.count();
  const isSetupMode = userCount === 0;
  
  // Proteger rutas admin - redirigir a login si no está autenticado
  // EXCEPTO si no hay usuarios (modo configuración inicial)
  if (!user && !isSetupMode) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Banner de modo setup */}
      {isSetupMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          ⚠️ Modo configuración inicial - Crea tu primer usuario administrador
        </div>
      )}

      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          {/* Título + Ver sitio en la misma fila */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-base sm:text-lg font-semibold text-neutral-800 truncate">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'dueno' ? 'Mi Barbería' : 'Mi Panel'}
            </Link>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-700 shrink-0 ml-3"
            >
              Ver sitio
            </Link>
          </div>
          {/* Nav como fila de tabs debajo */}
          <nav className="flex items-center gap-1 mt-2 -mb-3 overflow-x-auto">
            {/* Usuarios: admin siempre, dueno solo lectura/edición limitada, setup mode */}
            {(isSetupMode || user?.role === 'admin' || user?.role === 'dueno') && (
              <Link
                href="/admin/users"
                className="shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              >
                Usuarios
              </Link>
            )}
            {/* Todas las reservas: admin y dueno */}
            {!isSetupMode && (user?.role === 'admin' || user?.role === 'dueno') && (
              <Link
                href="/admin/bookings"
                className="shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              >
                Reservas
              </Link>
            )}
            {/* Mis Reservas: dueno y barbero (los que aparecen en la home) */}
            {!isSetupMode && (user?.role === 'barbero' || user?.role === 'dueno') && (
              <Link
                href="/admin/mis-reservas"
                className="shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              >
                Mis Reservas
              </Link>
            )}
            {/* Gestión de horarios: dueno y barbero */}
            {!isSetupMode && (user?.role === 'barbero' || user?.role === 'dueno') && (
              <Link
                href="/admin/horarios"
                className="shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              >
                Horarios
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Barra de usuario - solo si está logueado */}
      {user && (
        <div className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'Usuario'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-300 text-neutral-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium text-neutral-800">{user.name || 'Usuario'}</p>
                <p className="text-xs text-neutral-500">
                  {user.role === 'admin' ? 'Administrador' : user.role === 'dueno' ? 'Dueño' : 'Barbero'}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
