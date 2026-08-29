import { redirect } from 'next/navigation';
import { requireTenant } from '@/lib/tenant/context';
import { resolveTenantPlan } from '@/lib/tenant/subscription';
import AdminConfigContent from './AdminConfigContent';

export default async function AdminConfigPage() {
  const tenant = await requireTenant();

  if (resolveTenantPlan(tenant) !== 'cadena') {
    redirect('/admin');
  }

  return <AdminConfigContent />;
}
