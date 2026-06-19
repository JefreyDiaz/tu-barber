import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignOutButton } from './SignOutButton';
import { AdminNav } from './AdminNav';
import TrialBanner from './TrialBanner';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { TENANT_SLUG_HEADER } from '@/lib/tenant/context';
import { trialDaysLeft, isTrialing } from '@/lib/tenant/subscription';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;
  const tenant = await getTenantFromHeaders();
  const h = await headers();
  const slug = h.get(TENANT_SLUG_HEADER);
  const tq = slug ? `?tenant=${slug}` : '';

  const userCount = tenant
    ? await prisma.user.count({ where: { tenantId: tenant.id } })
    : await prisma.user.count({ where: { tenantId: { not: null } } });

  const isSetupMode = userCount === 0;

  if (!user && !isSetupMode) {
    redirect('/login');
  }

  if (user?.tenantId && tenant && user.tenantId !== tenant.id) {
    redirect('/login');
  }

  const shopName = tenant?.name ?? 'Admin';

  let trialInfo: { daysLeft: number; plan: string } | null = null;
  if (tenant && !isSetupMode) {
    const sub = {
      plan: tenant.plan,
      subscriptionStatus: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
    };
    if (isTrialing(sub)) {
      const daysLeft = trialDaysLeft(sub);
      if (daysLeft !== null && daysLeft > 0) {
        trialInfo = { daysLeft, plan: tenant.plan };
      }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {isSetupMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Modo configuración inicial — Crea tu primer usuario administrador
        </div>
      )}

      {trialInfo && <TrialBanner daysLeft={trialInfo.daysLeft} selectedPlan={trialInfo.plan} />}

      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={`/admin${tq}`} className="text-base sm:text-lg font-semibold text-neutral-800 truncate">
              {user?.role === 'admin' ? shopName : user?.role === 'dueno' ? 'Mi Barbería' : 'Mi Panel'}
            </Link>
            <Link href={`/${tq}`} className="text-sm text-neutral-500 hover:text-neutral-700 shrink-0 ml-3">
              Ver sitio
            </Link>
          </div>
          <AdminNav tq={tq} isSetupMode={isSetupMode} role={user?.role} />
        </div>
      </header>

      {user && (
        <div className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <div className="text-sm">
              <p className="font-medium text-neutral-800">{user.name || 'Usuario'}</p>
              <p className="text-xs text-neutral-500">
                {user.role === 'admin' ? 'Administrador' : user.role === 'dueno' ? 'Dueño' : 'Barbero'}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
