import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Obtener datos de una reserva (para la página de cancelación)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        barber: {
          select: { id: true, name: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        customerName: booking.customerName,
        barberName: booking.barber.name,
        dateTime: booking.dateTime,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la reserva' },
      { status: 500 }
    );
  }
}

// PATCH: Cancelar una reserva
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const session = await auth();
    const role = session?.user?.role;
    const isStaff = role === 'admin' || role === 'dueno' || role === 'barbero';

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Ya está cancelada
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Esta reserva ya fue cancelada' },
        { status: 400 }
      );
    }

    // Si es barbero, solo puede cancelar sus propias citas.
    if (role === 'barbero' && session?.user?.id !== booking.barberId) {
      return NextResponse.json(
        { success: false, error: 'No puedes cancelar citas de otro barbero' },
        { status: 403 }
      );
    }

    const now = new Date();

    // Ya pasó la cita
    if (now > booking.dateTime) {
      return NextResponse.json(
        { success: false, error: 'No se puede cancelar una cita que ya pasó' },
        { status: 400 }
      );
    }

    // Flujo público (cliente): mantiene restricción de 2 horas.
    if (!isStaff) {
      const minCancelTime = new Date(booking.dateTime.getTime() - 2 * 60 * 60 * 1000);
      if (now > minCancelTime) {
        return NextResponse.json(
          { success: false, error: 'No se puede cancelar con menos de 2 horas de anticipación' },
          { status: 400 }
        );
      }
    }

    // Cancelar
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cancelar la reserva' },
      { status: 500 }
    );
  }
}
