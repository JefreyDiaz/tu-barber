import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { serviceSchema } from '@/lib/validations/service';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

async function authorize(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, status: 401, error: 'No autorizado' };

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return { ok: false as const, status: 404, error: 'Barbería no encontrada' };
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return { ok: false as const, status: 403, error: 'Sin permisos' };
  }

  if (session.user.role !== 'admin' && session.user.role !== 'dueno') {
    return { ok: false as const, status: 403, error: 'Sin permisos' };
  }

  return { ok: true as const, tenantId: tenant.id };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await authorize(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.issues }, { status: 400 });
  }

  const db = scopedPrisma(authResult.tenantId);
  const existing = await db.service.findFirst({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Servicio no encontrado' }, { status: 404 });
  }

  if (parsed.data.name !== existing.name) {
    const nameTaken = await db.service.findFirst({ where: { name: parsed.data.name } });
    if (nameTaken) {
      return NextResponse.json({ success: false, error: 'Nombre ya en uso' }, { status: 409 });
    }
  }

  await db.service.update({
    where: { id },
    data: {
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
  });

  const updated = await db.service.findFirst({ where: { id } });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await authorize(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  const db = scopedPrisma(authResult.tenantId);
  const existing = await db.service.findFirst({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Servicio no encontrado' }, { status: 404 });
  }

  await db.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
