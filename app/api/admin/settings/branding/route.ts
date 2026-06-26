import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tenantBrandingSchema } from '@/lib/validations/tenant';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { sanitizeBrandingPayload } from '@/lib/tenant/branding';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  const session = await auth();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'dueno')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = tenantBrandingSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos inválidos';
    return NextResponse.json({ success: false, error: first }, { status: 400 });
  }

  const branding = sanitizeBrandingPayload(parsed.data);

  try {
    const db = scopedPrisma(tenant.id);
    const settings = await db.settings.upsert({
      create: branding,
      update: branding,
    });

    return NextResponse.json({ success: true, data: { ...settings, tenantId: tenant.id } });
  } catch (error) {
    console.error('[admin/settings/branding PATCH]', error);
    return NextResponse.json(
      {
        success: false,
        error:
          'No se pudo guardar. Reinicia el servidor de desarrollo (npm run dev) tras aplicar migraciones.',
      },
      { status: 500 }
    );
  }
}
