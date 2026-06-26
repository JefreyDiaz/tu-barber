import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { isMultiBarberPlan } from '@/lib/tenant/subscription';
import { normalizePlanId } from '@/lib/plans';

export default async function BookingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'admin' && role !== 'dueno') {
    redirect('/admin/mis-reservas');
  }

  const tenant = await getTenantFromHeaders();
  if (!tenant || !isMultiBarberPlan(normalizePlanId(tenant.plan))) {
    redirect('/admin/mis-reservas');
  }

  return <>{children}</>;
}
