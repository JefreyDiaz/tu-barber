import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { serviceSchema } from '@/lib/validations/service';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  const authResult = await authorize(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const db = scopedPrisma(authResult.tenantId);
  try {
    const services = await db.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('[admin/services GET]', error);
    const message =
      error instanceof Error && error.message.includes('Service')
        ? 'Tabla Service no encontrada. Ejecuta: npx prisma migrate deploy'
        : 'Error al obtener servicios';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authorize(request);
  if (!authResult.ok) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.issues }, { status: 400 });
  }

  const db = scopedPrisma(authResult.tenantId);
  const existing = await db.service.findFirst({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ success: false, error: 'Ya existe un servicio con ese nombre' }, { status: 409 });
  }

  const maxOrder = await db.service.findMany({ orderBy: { sortOrder: 'desc' }, take: 1 });
  const sortOrder = parsed.data.sortOrder ?? (maxOrder[0]?.sortOrder ?? 0) + 1;

  const service = await db.service.create({
    data: {
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      sortOrder,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ success: true, data: service }, { status: 201 });
}
