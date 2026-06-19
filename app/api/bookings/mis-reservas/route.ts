import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'barbero' && session.user.role !== 'dueno') {
    return NextResponse.json({ success: false, error: 'Esta ruta es solo para barberos y dueños' }, { status: 403 });
  }

  if (!session.user.tenantId) {
    return NextResponse.json({ success: false, error: 'Sin tenant' }, { status: 403 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: session.user.tenantId,
        barberId: session.user.id,
        status: { not: 'cancelled' },
      },
      orderBy: { dateTime: 'asc' },
      select: {
        id: true, customerName: true, customerPhone: true,
        dateTime: true, status: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching barber bookings:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener reservas' }, { status: 500 });
  }
}
