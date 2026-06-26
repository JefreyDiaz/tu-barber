import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { isMultiBarberPlan } from '@/lib/tenant/subscription';
import { normalizePlanId } from '@/lib/plans';

export default async function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  const tenant = await getTenantFromHeaders();
  const userCount = tenant
    ? await prisma.user.count({ where: { tenantId: tenant.id } })
    : await prisma.user.count({ where: { tenantId: { not: null } } });
  const isSetupMode = userCount === 0;

  const role = session?.user?.role;
  if (!isSetupMode && role !== 'admin' && role !== 'dueno') {
    redirect('/admin/mis-reservas');
  }

  if (
    !isSetupMode &&
    tenant &&
    !isMultiBarberPlan(normalizePlanId(tenant.plan))
  ) {
    redirect('/admin/mis-reservas');
  }

  return <>{children}</>;
}
