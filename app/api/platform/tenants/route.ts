import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        onboarding: true,
        users: {
          where: { role: 'dueno' },
          select: { username: true, name: true, isActive: true, email: true },
          take: 1,
        },
        _count: { select: { users: true, bookings: true, services: true } },
      },
    });

    const data = tenants.map(({ users, ...t }) => ({
      ...t,
      owner: users[0] ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[platform/tenants GET]', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar tenants' },
      { status: 500 }
    );
  }
}
