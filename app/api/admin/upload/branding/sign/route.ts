import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { createBrandingSignedUpload } from '@/lib/supabase/storage';

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
    const body = await request.json();
    const kind = body.kind as string;
    const contentType = String(body.contentType ?? '').trim();
    const size = Number(body.size);

    if (kind !== 'logo' && kind !== 'background') {
      return NextResponse.json({ success: false, error: 'Tipo de archivo inválido' }, { status: 400 });
    }
    if (!contentType || !Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ success: false, error: 'Archivo inválido' }, { status: 400 });
    }

    const upload = await createBrandingSignedUpload(tenant.id, kind, contentType, size);
    return NextResponse.json({ success: true, data: upload });
  } catch (error) {
    console.error('[upload/branding/sign]', error);
    const message = error instanceof Error ? error.message : 'Error al preparar subida';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
