import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { platformTutorialReorderSchema } from '@/lib/validations/tutorial';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = platformTutorialReorderSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { orderedIds } = parsed.data;
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return NextResponse.json({ success: false, error: 'IDs duplicados' }, { status: 400 });
    }

    const existing = await prisma.platformTutorial.findMany({ select: { id: true } });
    if (existing.length !== orderedIds.length) {
      return NextResponse.json(
        { success: false, error: 'La lista de tutoriales no coincide' },
        { status: 400 }
      );
    }

    const existingIds = new Set(existing.map((t) => t.id));
    if (!orderedIds.every((id) => existingIds.has(id))) {
      return NextResponse.json({ success: false, error: 'Tutorial no encontrado' }, { status: 404 });
    }

    const updated = await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.platformTutorial.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[platform/tutorials/reorder PATCH]', error);
    return NextResponse.json(
      { success: false, error: 'Error al reordenar tutoriales' },
      { status: 500 }
    );
  }
}
