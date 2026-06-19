import { LoginForm } from '@/components/LoginForm';
import { getTenantFromHeaders } from '@/lib/tenant/context';

export default async function LoginPage() {
  const tenant = await getTenantFromHeaders();

  return (
    <LoginForm
      tenantId={tenant?.id}
      tenantSlug={tenant?.slug}
      tenantName={tenant?.name}
      platformLogin={false}
    />
  );
}
