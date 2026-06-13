import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Rango UTC de un día: encuentra registros sin importar con qué timezone se guardaron
function dayRange(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  // El registro pudo haberse guardado con cualquier offset (-5 a 0),
  // así que ampliamos el rango para cubrir ambos extremos
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0)); // +5h para cubrir UTC-5
  return { gte: start, lt: end };
}

// Rango de un mes completo (amplio para cubrir timezones)
function monthRange(monthStr: string) {
  const [y, m] = monthStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 5, 0, 0, 0)); // primer día del mes siguiente +5h
  return { gte: start, lt: end };
}

// Fecha canónica para guardar (siempre UTC medianoche)
function toUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)); // mediodía UTC para evitar problemas de borde
}

// Verificar permisos: admin puede todo, barbero/dueño solo sus propios datos
function canManage(session: { user?: { role?: string; id?: string } }, barberId: string): boolean {
  if (!session.user) return false;
  if (session.user.role === 'admin') return true;
  return session.user.id === barberId;
}

// ═══════════════════════════════════════════════════════════════
// GET: Obtener bloqueos
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const barberId = sp.get('barberId');
    const date = sp.get('date');
    const month = sp.get('month');

    const where: Record<string, unknown> = {};

    if (barberId) {
      where.barberId = barberId;
    } else if (session.user.role === 'barbero' || session.user.role === 'dueno') {
      where.barberId = session.user.id;
    }

    if (date) {
      where.date = dayRange(date);
    } else if (month) {
      where.date = monthRange(month);
    }

    const blocks = await prisma.blockedSlot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: { barber: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: blocks });
  } catch (error) {
    console.error('Error fetching blocked slots:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener bloqueos' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST: Crear bloqueo (día completo o turno específico)
// ═══════════════════════════════════════════════════════════════
const blockSlotSchema = z.object({
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isFullDay: z.boolean(),
  time: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const result = blockSlotSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.issues }, { status: 400 });
    }

    const { barberId, date, isFullDay, time, reason } = result.data;

    if (!canManage(session, barberId)) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    if (!isFullDay && !time) {
      return NextResponse.json({ success: false, error: 'Debe especificar hora' }, { status: 400 });
    }

    const dateObj = toUTCDate(date);
    const range = dayRange(date);

    if (isFullDay) {
      // Eliminar TODOS los bloqueos del día (individuales y de día completo previos)
      await prisma.blockedSlot.deleteMany({
        where: { barberId, date: range },
      });

      // Crear bloqueo de día completo
      const block = await prisma.blockedSlot.create({
        data: {
          barberId,
          date: dateObj,
          isFullDay: true,
          time: null,
          reason: reason || null,
        },
      });

      return NextResponse.json({ success: true, data: block }, { status: 201 });
    } else {
      // Verificar si el día ya está bloqueado completamente
      const fullDayBlock = await prisma.blockedSlot.findFirst({
        where: { barberId, date: range, isFullDay: true },
      });

      if (fullDayBlock) {
        return NextResponse.json(
          { success: false, error: 'Este día ya está bloqueado completamente' },
          { status: 409 }
        );
      }

      // Eliminar bloqueo existente para este turno (si existe, sin importar la fecha exacta)
      await prisma.blockedSlot.deleteMany({
        where: { barberId, date: range, time: time! },
      });

      // Crear nuevo bloqueo para este turno
      const block = await prisma.blockedSlot.create({
        data: {
          barberId,
          date: dateObj,
          isFullDay: false,
          time: time!,
          reason: reason || null,
        },
      });

      return NextResponse.json({ success: true, data: block }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating blocked slot:', error);
    return NextResponse.json({ success: false, error: 'Error al crear bloqueo' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE: Eliminar bloqueo
// ═══════════════════════════════════════════════════════════════
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const id = sp.get('id');
    const barberId = sp.get('barberId');
    const date = sp.get('date');
    const time = sp.get('time');

    // Eliminar por ID
    if (id) {
      const block = await prisma.blockedSlot.findUnique({ where: { id } });
      if (!block) {
        return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 });
      }
      if (!canManage(session, block.barberId)) {
        return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
      }
      await prisma.blockedSlot.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // Eliminar por barberId + date (+ time opcional)
    if (barberId && date) {
      if (!canManage(session, barberId)) {
        return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
      }

      const range = dayRange(date);

      if (time) {
        await prisma.blockedSlot.deleteMany({
          where: { barberId, date: range, time },
        });
      } else {
        await prisma.blockedSlot.deleteMany({
          where: { barberId, date: range },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Parámetros insuficientes' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting blocked slot:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar bloqueo' }, { status: 500 });
  }
}
