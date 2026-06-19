import { redirect } from 'next/navigation';
import { getTenantFromHeaders } from '@/lib/tenant/context';

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantFromHeaders();

  if (tenant && tenant.status !== 'active') {
    redirect(`/tenant-status?status=${tenant.status}`);
  }

  return <>{children}</>;
}
