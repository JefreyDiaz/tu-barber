import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { combineDateAndTime, isValidBookingDateTime, type ScheduleConfig } from '@/lib/schedule';
import { bookingToInterval, getAvailableSlotsForDuration } from '@/lib/slot-availability';
import { getColombiaDayRange } from '@/lib/date-utils';
import { sendBookingConfirmation, sendBarberNotification } from '@/lib/messaging/booking-messages';
import { auth } from '@/lib/auth';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { scopedPrisma, assertBarberInTenant } from '@/lib/tenant/prisma-scoped';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'admin' && session.user.role !== 'dueno') {
    return NextResponse.json({ success: false, error: 'Sin permisos para ver reservas' }, { status: 403 });
  }

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const db = scopedPrisma(tenant.id);
    const bookings = await db.booking.findMany({
      where: { status: { not: 'cancelled' } },
      orderBy: { dateTime: 'desc' },
      include: {
        barber: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMinutes: true } },
      },
    });
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener reservas' }, { status: 500 });
  }
}

const bookingSchema = z.object({
  barberId: z.string().min(1, 'ID de barbero requerido'),
  serviceId: z.string().min(1, 'Servicio requerido'),
  customerName: z.string().min(2).max(50).trim(),
  customerPhone: z
    .string()
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos')
    .transform((s) => '+57' + s),
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().regex(/^\d{1,2}:\d{2}\s*(AM|PM)$/i, 'Formato de hora inválido'),
});

export async function POST(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  try {
    const body = await request.json();
    const result = bookingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.issues }, { status: 400 });
    }

    const { barberId, serviceId, customerName, customerPhone, date, time } = result.data;
    const db = scopedPrisma(tenant.id);
    const settings = await db.settings.findUnique();
    const scheduleJson = (settings?.scheduleJson as ScheduleConfig | null) ?? null;

    const service = await db.service.findFirst({ where: { id: serviceId, isActive: true } });
    if (!service) {
      return NextResponse.json({ success: false, error: 'Servicio no encontrado' }, { status: 404 });
    }

    const durationMinutes = service.durationMinutes;

    const [year, month, day] = date.split('-').map(Number);
    const dateTime = combineDateAndTime(new Date(year, month - 1, day), time);

    if (!isValidBookingDateTime(dateTime, scheduleJson, durationMinutes)) {
      return NextResponse.json({ success: false, error: 'Fecha u hora no válida' }, { status: 400 });
    }

    if (!(await assertBarberInTenant(barberId, tenant.id))) {
      return NextResponse.json({ success: false, error: 'Barbero no encontrado' }, { status: 404 });
    }

    const { startOfDay, endOfDay } = getColombiaDayRange(year, month, day);
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
    const selectedDate = new Date(year, month - 1, day);
    const available = getAvailableSlotsForDuration(
      selectedDate,
      durationMinutes,
      scheduleJson,
      occupiedIntervals,
      new Set()
    );

    if (!available.includes(time)) {
      return NextResponse.json({ success: false, error: 'Este horario ya no está disponible' }, { status: 409 });
    }

    const barber = await db.user.findFirst({
      where: { id: barberId, role: { in: ['barbero', 'dueno'] }, isActive: true },
    });
    if (!barber) {
      return NextResponse.json({ success: false, error: 'Barbero no encontrado' }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        barberId,
        serviceId: service.id,
        durationMinutes,
        customerName: customerName.trim(),
        customerPhone,
        dateTime,
        status: 'pending',
      },
      include: { barber: true, service: true },
    });

    const tenantSettings = settings
      ? {
          manychatApiKey: settings.manychatApiKey,
          manychatFlowBooking: settings.manychatFlowBooking,
          manychatFlowBarber: settings.manychatFlowBarber,
          manychatFlowReminder: settings.manychatFlowReminder,
          manychatFieldMap: settings.manychatFieldMap as Record<string, string> | null,
        }
      : null;

    await sendBookingConfirmation(
      {
        to: customerPhone,
        customerName: booking.customerName,
        barberName: booking.barber.name,
        barberPhone: booking.barber.phone,
        dateTime: booking.dateTime,
        bookingId: booking.id,
        tenantSlug: tenant.slug,
      },
      tenantSettings
    );

    if (booking.barber.phone) {
      await sendBarberNotification(
        {
          barberPhone: booking.barber.phone,
          barberName: booking.barber.name,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          dateTime: booking.dateTime,
        },
        tenantSettings
      );
    }

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ success: false, error: 'Error al crear la reserva' }, { status: 500 });
  }
}
