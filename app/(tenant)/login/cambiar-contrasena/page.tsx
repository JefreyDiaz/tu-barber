import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { formatTenantHostForRequest } from '@/lib/tenant/urls';
import { headers } from 'next/headers';

export default async function CambiarContrasenaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.mustChangePassword) {
    redirect('/admin');
  }

  const tenant = await getTenantFromHeaders();
  const requestHost = (await headers()).get('host') ?? '';
  const tenantDisplayHost =
    tenant?.slug != null
      ? formatTenantHostForRequest(tenant.slug, requestHost, tenant.customDomain)
      : undefined;

  return (
    <ChangePasswordForm tenantName={tenant?.name} tenantDisplayHost={tenantDisplayHost} />
  );
}
