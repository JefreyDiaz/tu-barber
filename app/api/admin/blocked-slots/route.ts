import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { canManageBarber } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';

export const dynamic = 'force-dynamic';

function dayRange(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)), lt: new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0)) };
}

function monthRange(monthStr: string) {
  const [y, m] = monthStr.split('-').map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0)), lt: new Date(Date.UTC(y, m, 1, 5, 0, 0, 0)) };
}

function toUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

export async function GET(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const db = scopedPrisma(tenant.id);
  const sp = request.nextUrl.searchParams;
  const barberId = sp.get('barberId');
  const date = sp.get('date');
  const month = sp.get('month');

  const where: Record<string, unknown> = {};
  if (barberId) where.barberId = barberId;
  else if (session.user.role === 'barbero' || session.user.role === 'dueno') where.barberId = session.user.id;
  if (date) where.date = dayRange(date);
  else if (month) where.date = monthRange(month);

  const blocks = await db.blockedSlot.findMany({
    where,
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: { barber: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ success: true, data: blocks });
}

const blockSlotSchema = z.object({
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isFullDay: z.boolean(),
  time: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

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
  if (!canManageBarber(session, barberId)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  const db = scopedPrisma(tenant.id);
  const dateObj = toUTCDate(date);
  const range = dayRange(date);

  if (isFullDay) {
    await db.blockedSlot.deleteMany({ where: { barberId, date: range } });
    const block = await db.blockedSlot.create({
      data: { barberId, date: dateObj, isFullDay: true, time: null, reason: reason || null },
    });
    return NextResponse.json({ success: true, data: block }, { status: 201 });
  }

  if (!time) {
    return NextResponse.json({ success: false, error: 'Debe especificar hora' }, { status: 400 });
  }

  const fullDayBlock = await db.blockedSlot.findFirst({
    where: { barberId, date: range, isFullDay: true },
  });
  if (fullDayBlock) {
    return NextResponse.json({ success: false, error: 'Este día ya está bloqueado completamente' }, { status: 409 });
  }

  await db.blockedSlot.deleteMany({ where: { barberId, date: range, time } });
  const block = await db.blockedSlot.create({
    data: { barberId, date: dateObj, isFullDay: false, time, reason: reason || null },
  });

  return NextResponse.json({ success: true, data: block }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const db = scopedPrisma(tenant.id);
  const sp = request.nextUrl.searchParams;
  const id = sp.get('id');
  const barberId = sp.get('barberId');
  const date = sp.get('date');
  const time = sp.get('time');

  if (id) {
    const block = await db.blockedSlot.findFirst({ where: { id } });
    if (!block) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 });
    if (!canManageBarber(session, block.barberId)) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }
    await db.blockedSlot.deleteMany({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (barberId && date) {
    if (!canManageBarber(session, barberId)) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }
    const range = dayRange(date);
    if (time) {
      await db.blockedSlot.deleteMany({ where: { barberId, date: range, time } });
    } else {
      await db.blockedSlot.deleteMany({ where: { barberId, date: range } });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Parámetros insuficientes' }, { status: 400 });
}
