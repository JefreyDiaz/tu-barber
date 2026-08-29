import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calendarRangeToUtcBounds,
  resolveBookingStatsRange,
} from '@/lib/platform/booking-stats-range';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  preset: z.enum(['this_month', 'last_month', 'today', 'yesterday', 'day', 'range']),
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, timezone: true },
  });

  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant no encontrado' }, { status: 404 });
  }

  try {
    const { preset, date, from, to } = parsed.data;
    const range = resolveBookingStatsRange(preset, tenant.timezone, new Date(), {
      date,
      from,
      to,
    });
    const { start, end } = calendarRangeToUtcBounds(range.fromKey, range.toKey, tenant.timezone);

    const [count, totalAllTime] = await Promise.all([
      prisma.booking.count({
        where: {
          tenantId: tenant.id,
          status: { not: 'cancelled' },
          dateTime: { gte: start, lte: end },
        },
      }),
      prisma.booking.count({
        where: {
          tenantId: tenant.id,
          status: { not: 'cancelled' },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        count,
        totalAllTime,
        label: range.label,
        fromKey: range.fromKey,
        toKey: range.toKey,
        preset: range.preset,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al calcular reservas';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
