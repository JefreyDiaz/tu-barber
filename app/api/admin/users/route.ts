import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { createUserSchema } from '@/lib/validations/user';
import { auth } from '@/lib/auth';
import { requireApiTenant } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return NextResponse.json({ success: false, error: 'Barbería no encontrada' }, { status: 404 });
  }

  const db = scopedPrisma(tenant.id);
  const userCount = await db.user.count();
  const isSetupMode = userCount === 0;

  const session = await auth();
  if (!session?.user && !isSetupMode) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session?.user && !assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  if (!isSetupMode && session?.user?.role !== 'admin' && session?.user?.role !== 'dueno') {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, username: true, photo: true, email: true,
        phone: true, role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return NextResponse.json({ success: false, error: 'Barbería no encontrada' }, { status: 404 });
  }

  const db = scopedPrisma(tenant.id);
  const userCount = await db.user.count();
  const isSetupMode = userCount === 0;

  const session = await auth();
  if (!session?.user && !isSetupMode) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  if (!isSetupMode && session?.user?.role !== 'admin' && session?.user?.role !== 'dueno') {
    return NextResponse.json({ success: false, error: 'Solo administradores pueden crear usuarios' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const message = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ') || 'Datos inválidos';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    if (session?.user?.role === 'dueno' && parsed.data.role !== 'barbero') {
      return NextResponse.json({ success: false, error: 'El dueño solo puede crear barberos' }, { status: 403 });
    }

    const { name, username, password, photo, email, phone, role, isActive } = parsed.data;

    const existing = await db.user.findFirst({ where: { username } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ese nombre de usuario ya está en uso' }, { status: 409 });
    }

    const created = await db.user.create({
      data: {
        name, username, password: await hashPassword(password),
        photo: photo || undefined, email: email || undefined, phone, role, isActive,
      },
    });

    const user = await db.user.findFirst({
      where: { id: created.id },
      select: {
        id: true, name: true, username: true, photo: true, email: true,
        phone: true, role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Error al crear usuario' }, { status: 500 });
  }
}
