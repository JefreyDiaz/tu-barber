import { redirect } from 'next/navigation';
import { assertTenantExists } from '@/lib/tenant/context';

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await assertTenantExists();

  if (tenant && tenant.status !== 'active') {
    redirect(`/tenant-status?status=${tenant.status}`);
  }

  return <>{children}</>;
}
