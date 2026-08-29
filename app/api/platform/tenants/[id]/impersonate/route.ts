import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createImpersonationToken } from '@/lib/auth/impersonation';
import { buildTenantUrl } from '@/lib/tenant/urls';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true },
  });

  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant no encontrado' }, { status: 404 });
  }

  if (tenant.status !== 'active') {
    return NextResponse.json(
      { success: false, error: 'Solo se puede suplantar un tenant activo' },
      { status: 400 }
    );
  }

  const targetUser =
    (await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'dueno', isActive: true },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'admin', isActive: true },
      select: { id: true },
    }));

  if (!targetUser) {
    return NextResponse.json(
      { success: false, error: 'No hay dueño ni admin activo para este tenant' },
      { status: 400 }
    );
  }

  const token = await createImpersonationToken({
    superAdminId: session.user.id,
    targetUserId: targetUser.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  });

  const redirectUrl = `${buildTenantUrl(tenant.slug, '/login/impersonate')}?token=${encodeURIComponent(token)}`;

  return NextResponse.json({ success: true, redirectUrl });
}
