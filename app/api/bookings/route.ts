import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { combineDateAndTime, isValidBookingDateTime } from '@/lib/schedule';
import { sendBookingConfirmationWhatsApp, sendBarberNotificationWhatsApp } from '@/lib/twilio';

export const dynamic = 'force-dynamic';

// GET: Listar todas las reservas (para admin)
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: { not: 'cancelled' },
      },
      orderBy: { dateTime: 'desc' },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}

const bookingSchema = z.object({
  barberId: z.string().min(1, 'ID de barbero requerido'),
  customerName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  customerPhone: z
    .string()
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos (sin espacios ni guiones)')
    .transform((s) => '+57' + s),
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().regex(/^\d{1,2}:\d{2}\s*(AM|PM)$/i, 'Formato de hora inválido (ej: 8:00 AM, 8:40 AM)'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = bookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.issues },
        { status: 400 }
      );
    }

    const { barberId, customerName, customerPhone, date, time } = result.data;

    // Parsear fecha en zona local (evita problemas de timezone con "YYYY-MM-DD")
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    // Combinar fecha y hora
    const dateTime = combineDateAndTime(selectedDate, time);

    // Validar que la fecha/hora sea válida
    if (!isValidBookingDateTime(dateTime)) {
      return NextResponse.json(
        { success: false, error: 'Fecha u hora no válida para reservar' },
        { status: 400 }
      );
    }

    // Verificar que no haya una reserva duplicada
    const existingBooking = await prisma.booking.findFirst({
      where: {
        barberId,
        dateTime,
        status: {
          not: 'cancelled',
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Este horario ya está reservado' },
        { status: 409 }
      );
    }

    // Verificar que el barbero/dueño existe y está activo
    const barber = await prisma.user.findUnique({
      where: { 
        id: barberId,
        role: { in: ['barbero', 'dueno'] },
        isActive: true,
      },
    });

    if (!barber) {
      return NextResponse.json(
        { success: false, error: 'Barbero no encontrado' },
        { status: 404 }
      );
    }

    // Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        barberId,
        customerName: customerName.trim(),
        customerPhone,
        dateTime,
        status: 'pending',
      },
      include: {
        barber: true,
      },
    });

    // Notificación WhatsApp al cliente (no bloquea la respuesta si falla)
    await sendBookingConfirmationWhatsApp({
      to: customerPhone,
      customerName: booking.customerName,
      barberName: booking.barber.name,
      barberPhone: booking.barber.phone,
      dateTime: booking.dateTime,
      bookingId: booking.id,
    });

    // Notificación WhatsApp al barbero (no bloquea la respuesta si falla)
    if (booking.barber.phone) {
      await sendBarberNotificationWhatsApp({
        barberPhone: booking.barber.phone,
        barberName: booking.barber.name,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        dateTime: booking.dateTime,
      });
    }

    return NextResponse.json(
      { success: true, data: booking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}
