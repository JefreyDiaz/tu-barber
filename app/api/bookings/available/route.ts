import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAvailableTimeSlots, parseAmPmToMinutes, formatMinutesToAmPm } from '@/lib/schedule';
import { colombiaToUTC, getColombiaComponents, getColombiaDayRange, toColombiaDateString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');

    if (!barberId || !date) {
      return NextResponse.json(
        { success: false, error: 'barberId y date son requeridos' },
        { status: 400 }
      );
    }

    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    let timeSlots = getAvailableTimeSlots(selectedDate);

    const now = new Date();
    const minAdvance = new Date(now.getTime() + 60 * 60 * 1000);
    const todayColombia = toColombiaDateString(now);
    const isToday = date === todayColombia;

    if (isToday) {
      timeSlots = timeSlots.filter((slot) => {
        const totalMinutes = parseAmPmToMinutes(slot);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const slotUTC = colombiaToUTC(year, month - 1, day, hours, minutes);
        return slotUTC >= minAdvance;
      });
    }

    // Rango amplio para encontrar bloqueos
    const blockDateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const blockDateEnd = new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0, 0));

    // Rango del día en Colombia para consultar bookings
    const { startOfDay, endOfDay } = getColombiaDayRange(year, month, day);

    try {
      if (prisma.blockedSlot) {
        const blocks = await prisma.blockedSlot.findMany({
          where: {
            barberId,
            date: {
              gte: blockDateStart,
              lt: blockDateEnd,
            },
          },
        });

        const fullDayBlock = blocks.find((b) => b.isFullDay);
        if (fullDayBlock) {
          return NextResponse.json({ success: true, data: [] });
        }

        const blockedTimes = new Set(
          blocks.filter((b) => !b.isFullDay && b.time).map((b) => b.time!)
        );
        if (blockedTimes.size > 0) {
          timeSlots = timeSlots.filter((slot) => !blockedTimes.has(slot));
        }
      }
    } catch (blockError) {
      console.warn('BlockedSlot table not available yet, skipping block checks:', blockError);
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        barberId,
        dateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'cancelled',
        },
      },
    });

    const occupiedTimes = new Set(
      existingBookings.map((booking) => {
        const { hours, minutes } = getColombiaComponents(new Date(booking.dateTime));
        return formatMinutesToAmPm(hours * 60 + minutes);
      })
    );

    const availableSlots = timeSlots.filter((slot) => !occupiedTimes.has(slot));

    return NextResponse.json({ success: true, data: availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener horarios disponibles' },
      { status: 500 }
    );
  }
}
