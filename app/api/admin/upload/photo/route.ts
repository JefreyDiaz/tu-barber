import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { uploadBarberPhoto } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
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
    const targetUserId = (formData.get('userId') as string | null) ?? session.user.id;

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }

    const db = scopedPrisma(tenant.id);
    const targetUser = await db.user.findFirst({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const isSelf = targetUserId === session.user.id;
    const role = session.user.role;

    if (!isSelf && role !== 'admin' && role !== 'dueno') {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    if (role === 'dueno' && !isSelf && targetUser.role === 'admin') {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const publicUrl = await uploadBarberPhoto(tenant.id, targetUserId, file);

    await db.user.update({
      where: { id: targetUserId },
      data: { photo: publicUrl },
    });

    return NextResponse.json({ success: true, data: { url: publicUrl } });
  } catch (error) {
    console.error('[upload/photo]', error);
    const message = error instanceof Error ? error.message : 'Error al subir imagen';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
