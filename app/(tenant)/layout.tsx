import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { assertTenantExists, TENANT_HEADERS } from '@/lib/tenant/context';
import { isTenantStatusExemptPath } from '@/lib/tenant/status-routes';

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await assertTenantExists();
  const pathname = (await headers()).get(TENANT_HEADERS.pathname) ?? '';

  if (
    tenant &&
    tenant.status !== 'active' &&
    !isTenantStatusExemptPath(pathname)
  ) {
    redirect(`/tenant-status?status=${tenant.status}`);
  }

  return <>{children}</>;
}
