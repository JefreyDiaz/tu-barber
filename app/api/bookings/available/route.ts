import { NextRequest, NextResponse } from 'next/server';
import { parseAmPmToMinutes, type ScheduleConfig } from '@/lib/schedule';
import { colombiaToUTC, getColombiaComponents, getColombiaDayRange, toColombiaDateString } from '@/lib/date-utils';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { scopedPrisma, assertBarberInTenant } from '@/lib/tenant/prisma-scoped';
import { bookingToInterval, getAvailableSlotsForDuration } from '@/lib/slot-availability';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!barberId || !date) {
      return NextResponse.json({ success: false, error: 'barberId y date son requeridos' }, { status: 400 });
    }

    if (!(await assertBarberInTenant(barberId, tenant.id))) {
      return NextResponse.json({ success: false, error: 'Barbero no encontrado' }, { status: 404 });
    }

    const db = scopedPrisma(tenant.id);
    const settings = await db.settings.findUnique();
    const scheduleJson = (settings?.scheduleJson as ScheduleConfig | null) ?? null;

    let durationMinutes = settings?.slotDurationMinutes ?? 40;
    if (serviceId) {
      const service = await db.service.findFirst({ where: { id: serviceId, isActive: true } });
      if (!service) {
        return NextResponse.json({ success: false, error: 'Servicio no encontrado' }, { status: 404 });
      }
      durationMinutes = service.durationMinutes;
    }

    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    const now = new Date();
    const minAdvance = new Date(now.getTime() + 60 * 60 * 1000);
    const todayColombia = toColombiaDateString(now);
    const isToday = date === todayColombia;

    const blockDateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const blockDateEnd = new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0, 0));
    const { startOfDay, endOfDay } = getColombiaDayRange(year, month, day);

    const blocks = await db.blockedSlot.findMany({
      where: { barberId, date: { gte: blockDateStart, lt: blockDateEnd } },
    });

    if (blocks.some((b) => b.isFullDay)) {
      return NextResponse.json({ success: true, data: [] });
    }

    const blockedTimes = new Set(blocks.filter((b) => !b.isFullDay && b.time).map((b) => b.time!));

    const existingBookings = await db.booking.findMany({
      where: {
        barberId,
        dateTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' },
      },
      select: { dateTime: true, durationMinutes: true },
    });

    const occupiedIntervals = existingBookings.map((b) =>
      bookingToInterval(new Date(b.dateTime), b.durationMinutes)
    );

    let timeSlots = getAvailableSlotsForDuration(
      selectedDate,
      durationMinutes,
      scheduleJson,
      occupiedIntervals,
      blockedTimes
    );

    if (isToday) {
      timeSlots = timeSlots.filter((slot) => {
        const totalMinutes = parseAmPmToMinutes(slot);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return colombiaToUTC(year, month - 1, day, hours, minutes) >= minAdvance;
      });
    }

    return NextResponse.json({ success: true, data: timeSlots, durationMinutes });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener horarios disponibles' }, { status: 500 });
  }
}
