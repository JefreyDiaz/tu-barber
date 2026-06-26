import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { uploadTenantBrandingAsset } from '@/lib/supabase/storage';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'dueno')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kind = formData.get('kind');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }

    if (kind !== 'logo' && kind !== 'background') {
      return NextResponse.json({ success: false, error: 'Tipo de archivo inválido' }, { status: 400 });
    }

    const publicUrl = await uploadTenantBrandingAsset(tenant.id, kind, file);

    const db = scopedPrisma(tenant.id);
    const field = kind === 'logo' ? 'logoUrl' : 'backgroundUrl';
    await db.settings.upsert({
      create: { [field]: publicUrl },
      update: { [field]: publicUrl },
    });

    return NextResponse.json({ success: true, data: { url: publicUrl, kind } });
  } catch (error) {
    console.error('[upload/branding]', error);
    const message =
      error instanceof TypeError && String(error.message).includes('FormData')
        ? 'Archivo demasiado grande o incompleto. Máximo 15 MB para video. Reinicia el servidor tras actualizar la configuración.'
        : error instanceof Error
          ? error.message
          : 'Error al subir archivo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
