import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { finalizeBrandingUpload } from '@/lib/supabase/storage';
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
    const body = await request.json();
    const kind = body.kind as string;
    const path = String(body.path ?? '').trim();

    if (kind !== 'logo' && kind !== 'background') {
      return NextResponse.json({ success: false, error: 'Tipo de archivo inválido' }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ success: false, error: 'Ruta requerida' }, { status: 400 });
    }

    const publicUrl = await finalizeBrandingUpload(tenant.id, kind, path);

    const db = scopedPrisma(tenant.id);
    const field = kind === 'logo' ? 'logoUrl' : 'backgroundUrl';
    await db.settings.upsert({
      create: { [field]: publicUrl },
      update: { [field]: publicUrl },
    });

    return NextResponse.json({ success: true, data: { url: publicUrl, kind } });
  } catch (error) {
    console.error('[upload/branding/complete]', error);
    const message = error instanceof Error ? error.message : 'Error al finalizar subida';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
