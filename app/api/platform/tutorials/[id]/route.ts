import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { platformTutorialUpdateSchema } from '@/lib/validations/tutorial';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return unauthorized();
  }

  const { id } = await params;

  try {
    const existing = await prisma.platformTutorial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tutorial no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = platformTutorialUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const tutorial = await prisma.platformTutorial.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: tutorial });
  } catch (error) {
    console.error('[platform/tutorials PATCH]', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tutorial' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return unauthorized();
  }

  const { id } = await params;

  try {
    const existing = await prisma.platformTutorial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tutorial no encontrado' }, { status: 404 });
    }

    await prisma.platformTutorial.delete({ where: { id } });

    const remaining = await prisma.platformTutorial.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((tutorial, index) =>
          prisma.platformTutorial.update({
            where: { id: tutorial.id },
            data: { sortOrder: index + 1 },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[platform/tutorials DELETE]', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tutorial' },
      { status: 500 }
    );
  }
}
