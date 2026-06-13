import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { createUserSchema } from '@/lib/validations/user';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Verificar si hay usuarios (modo setup permite acceso sin auth)
  const userCount = await prisma.user.count();
  const isSetupMode = userCount === 0;
  
  // Verificar autenticación (excepto en modo setup)
  const session = await auth();
  if (!session?.user && !isSetupMode) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    );
  }

  // Solo admin y dueño pueden listar usuarios (fuera de setup mode)
  if (!isSetupMode && session?.user?.role !== 'admin' && session?.user?.role !== 'dueno') {
    return NextResponse.json(
      { success: false, error: 'Sin permisos para ver usuarios' },
      { status: 403 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        photo: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Verificar si hay usuarios (modo setup permite crear el primero sin auth)
  const userCount = await prisma.user.count();
  const isSetupMode = userCount === 0;
  
  // Verificar autenticación (excepto en modo setup)
  const session = await auth();
  if (!session?.user && !isSetupMode) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    );
  }

  // Solo admin puede crear usuarios (fuera de setup mode)
  if (!isSetupMode && session?.user?.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Solo administradores pueden crear usuarios' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const message = Object.values(firstError).flat().join(' ') || 'Datos inválidos';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    const { name, username, password, photo, email, phone, role, isActive } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ese nombre de usuario ya está en uso' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        photo: photo || undefined,
        email: email || undefined,
        phone,
        role,
        isActive,
      },
      select: {
        id: true,
        name: true,
        username: true,
        photo: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
