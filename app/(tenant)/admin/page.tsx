import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { isMultiBarberPlan } from '@/lib/tenant/subscription';
import { normalizePlanId } from '@/lib/plans';

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  const tenant = await getTenantFromHeaders();

  const userCount = tenant
    ? await prisma.user.count({ where: { tenantId: tenant.id } })
    : await prisma.user.count({ where: { tenantId: { not: null } } });
  const isSetupMode = userCount === 0;

  const multiBarber = tenant ? isMultiBarberPlan(normalizePlanId(tenant.plan)) : true;

  if (isSetupMode) {
    redirect('/admin/users');
  }

  if (role === 'admin') {
    redirect(multiBarber ? '/admin/bookings' : '/admin/services');
  }

  if (role === 'dueno') {
    redirect('/admin/mis-reservas');
  }

  redirect('/admin/mis-reservas');
}
