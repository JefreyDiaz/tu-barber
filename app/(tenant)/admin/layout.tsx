import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SignOutButton } from './SignOutButton';
import { AdminNav } from './AdminNav';
import TrialBanner from './TrialBanner';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import LogoFrame from '@/components/LogoFrame';
import { getTenantFromHeaders, TENANT_HEADERS } from '@/lib/tenant/context';
import { extractSubdomain } from '@/lib/tenant/host';
import { trialDaysLeft, isTrialing, isMultiBarberPlan } from '@/lib/tenant/subscription';
import { normalizePlanId } from '@/lib/plans';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;
  const tenant = await getTenantFromHeaders();
  const h = await headers();
  const slug = h.get(TENANT_HEADERS.slug);
  const host = h.get('host') ?? '';
  const tq = extractSubdomain(host) ? '' : slug ? `?tenant=${slug}` : '';

  if (user?.mustChangePassword && !user.impersonating) {
    redirect(`/login/cambiar-contrasena${tq}`);
  }

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
  const headerTitle =
    user?.role === 'admin' ? shopName : user?.role === 'dueno' ? 'Mi Barbería' : 'Mi Panel';

  const logoUrl = tenant
    ? (await scopedPrisma(tenant.id).settings.findUnique())?.logoUrl?.trim() || null
    : null;

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
        trialInfo = { daysLeft, plan: sub.plan };
      }
    }
  }

  const multiBarberPlan = tenant
    ? isMultiBarberPlan(normalizePlanId(tenant.plan))
    : true;

  return (
    <div className="admin-shell platform-bg min-h-screen min-h-[100dvh] text-white">
      {isSetupMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Modo configuración inicial — Crea tu primer usuario administrador
        </div>
      )}

      {user?.impersonating && <ImpersonationBanner />}

      {trialInfo && <TrialBanner daysLeft={trialInfo.daysLeft} selectedPlan={trialInfo.plan} />}

      <header className="sticky top-0 z-40 overflow-visible border-b border-white/5 bg-stone-950/75 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/admin${tq}`}
              className="flex min-w-0 items-center"
              aria-label={logoUrl ? shopName : undefined}
            >
              {logoUrl ? (
                <LogoFrame src={logoUrl} alt={shopName} size="admin" priority />
              ) : (
                <span className="truncate text-base font-bold sm:text-lg">{headerTitle}</span>
              )}
            </Link>
            <Link
              href={`/${tq}`}
              className="btn-glass shrink-0 rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm"
            >
              Ver sitio
            </Link>
          </div>
          <AdminNav
            tq={tq}
            isSetupMode={isSetupMode}
            role={user?.role}
            multiBarberPlan={multiBarberPlan}
          />
        </div>
      </header>

      {user && (
        <div className="border-b border-white/5 bg-white/[0.03]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
            <div className="text-sm">
              <p className="font-medium text-white/90">{user.name || 'Usuario'}</p>
              <p className="text-xs text-white/45">
                {user.role === 'admin'
                  ? 'Administrador'
                  : user.role === 'dueno'
                    ? 'Dueño'
                    : 'Barbero'}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6 pb-12 sm:py-8">{children}</main>
    </div>
  );
}
