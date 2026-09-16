import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireApiTenant, tenantErrorStatus } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    const err = tenantErrorStatus(e);
    return NextResponse.json({ success: false, error: err.error }, { status: err.status });
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const tutorials = await prisma.platformTutorial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        sortOrder: true,
        title: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
      },
    });
    return NextResponse.json({ success: true, data: tutorials });
  } catch (error) {
    console.error('[admin/tutorials GET]', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar tutoriales' },
      { status: 500 }
    );
  }
}
