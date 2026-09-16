import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { platformTutorialCreateSchema } from '@/lib/validations/tutorial';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return unauthorized();
  }

  try {
    const tutorials = await prisma.platformTutorial.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ success: true, data: tutorials });
  } catch (error) {
    console.error('[platform/tutorials GET]', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar tutoriales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const parsed = platformTutorialCreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const maxSort = await prisma.platformTutorial.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const tutorial = await prisma.platformTutorial.create({
      data: { ...parsed.data, sortOrder },
    });

    return NextResponse.json({ success: true, data: tutorial }, { status: 201 });
  } catch (error) {
    console.error('[platform/tutorials POST]', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear tutorial' },
      { status: 500 }
    );
  }
}
