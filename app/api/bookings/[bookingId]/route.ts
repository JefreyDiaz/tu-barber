import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getTenantFromApiRequest } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const tenant = await getTenantFromApiRequest(request);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        ...(tenant ? { tenantId: tenant.id } : {}),
      },
      include: {
        barber: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
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
    return NextResponse.json({ success: false, error: 'Error al obtener la reserva' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const session = await auth();
    const role = session?.user?.role;
    const isStaff = role === 'admin' || role === 'dueno' || role === 'barbero';
    const tenant = await getTenantFromApiRequest(request);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        ...(tenant ? { tenantId: tenant.id } : {}),
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (isStaff && session?.user?.tenantId && !assertSameTenant(session.user.tenantId, booking.tenantId)) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Esta reserva ya fue cancelada' }, { status: 400 });
    }

    if (role === 'barbero' && session?.user?.id !== booking.barberId) {
      return NextResponse.json({ success: false, error: 'No puedes cancelar citas de otro barbero' }, { status: 403 });
    }

    const now = new Date();
    if (now > booking.dateTime) {
      return NextResponse.json({ success: false, error: 'No se puede cancelar una cita que ya pasó' }, { status: 400 });
    }

    if (!isStaff) {
      const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: booking.tenantId } });
      const cancelHours = settings?.cancelNoticeHours ?? 2;
      const minCancelTime = new Date(booking.dateTime.getTime() - cancelHours * 60 * 60 * 1000);
      if (now > minCancelTime) {
        return NextResponse.json(
          { success: false, error: `No se puede cancelar con menos de ${cancelHours} horas de anticipación` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ success: false, error: 'Error al cancelar la reserva' }, { status: 500 });
  }
}
