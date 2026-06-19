import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { updateUserSchema, updateUserByOwnerSchema } from '@/lib/validations/user';
import { auth } from '@/lib/auth';
import { requireApiTenant } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
type RouteParams = { params: Promise<{ id: string }> };

async function verifyAuth(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false as const, error: 'No autorizado', status: 401 };
  }

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return { authorized: false as const, error: 'Barbería no encontrada', status: 404 };
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return { authorized: false as const, error: 'Sin permisos', status: 403 };
  }

  return {
    authorized: true as const,
    userId: session.user.id,
    role: session.user.role,
    tenantId: tenant.id,
  };
}

// GET - Obtener un usuario específico (admin y dueño)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  if (authResult.role !== 'admin' && authResult.role !== 'dueno') {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const db = scopedPrisma(authResult.tenantId);
    const user = await db.user.findFirst({
      where: { id },
      select: {
        id: true, name: true, username: true, photo: true,
        email: true, phone: true, role: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT - Actualizar usuario completo (SOLO admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  if (authResult.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Solo administradores pueden editar completamente' }, { status: 403 });
  }

  try {
    const db = scopedPrisma(authResult.tenantId);
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const message = Object.values(firstError).flat().join(' ') || 'Datos inválidos';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { name, username, password, photo, email, phone, role, isActive } = parsed.data;

    const existingUser = await db.user.findFirst({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (username !== existingUser.username) {
      const usernameTaken = await db.user.findFirst({ where: { username } });
      if (usernameTaken) {
        return NextResponse.json({ success: false, error: 'Ese nombre de usuario ya está en uso' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {
      name,
      username,
      photo: photo || undefined,
      email: email || undefined,
      phone,
      role,
      isActive,
    };

    if (password && password.length >= 8) {
      updateData.password = await hashPassword(password);
    }

    await db.user.update({ where: { id }, data: updateData });

    const user = await db.user.findFirst({
      where: { id },
      select: {
        id: true, name: true, username: true, photo: true,
        email: true, phone: true, role: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// PATCH - Actualizar usuario parcialmente (para dueño: solo nombre y teléfono)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  if (authResult.role !== 'dueno') {
    return NextResponse.json({ success: false, error: 'Solo el dueño puede usar esta acción' }, { status: 403 });
  }

  try {
    const db = scopedPrisma(authResult.tenantId);
    const body = await request.json();
    const parsed = updateUserByOwnerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const message = Object.values(firstError).flat().join(' ') || 'Datos inválidos';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { name, phone, password, isActive, photo } = parsed.data;

    const existingUser = await db.user.findFirst({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { name, phone };
    if (photo !== undefined) updateData.photo = photo || null;
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (password && password.length >= 8) {
      updateData.password = await hashPassword(password);
    }

    await db.user.update({ where: { id }, data: updateData });

    const user = await db.user.findFirst({
      where: { id },
      select: {
        id: true, name: true, username: true, photo: true,
        email: true, phone: true, role: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user (owner):', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE - Eliminar usuario (SOLO admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  if (authResult.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Solo administradores pueden eliminar usuarios' }, { status: 403 });
  }

  try {
    const db = scopedPrisma(authResult.tenantId);
    const existingUser = await db.user.findFirst({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (id === authResult.userId) {
      return NextResponse.json({ success: false, error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
