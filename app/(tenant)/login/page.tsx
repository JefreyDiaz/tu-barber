import { LoginForm } from '@/components/LoginForm';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { formatTenantHostForRequest } from '@/lib/tenant/urls';
import { headers } from 'next/headers';

export default async function LoginPage() {
  const tenant = await getTenantFromHeaders();
  const requestHost = (await headers()).get('host') ?? '';
  const tenantDisplayHost =
    tenant?.slug != null
      ? formatTenantHostForRequest(tenant.slug, requestHost, tenant.customDomain)
      : undefined;

  return (
    <LoginForm
      tenantId={tenant?.id}
      tenantSlug={tenant?.slug}
      tenantName={tenant?.name}
      tenantDisplayHost={tenantDisplayHost}
      platformLogin={false}
    />
  );
}
