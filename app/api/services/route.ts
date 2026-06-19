import { NextRequest, NextResponse } from 'next/server';
import { requireApiTenant } from '@/lib/tenant/api-helper';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';

export const dynamic = 'force-dynamic';

/** Public: active services for booking form */
export async function GET(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return NextResponse.json({ success: false, error: 'Barbería no encontrada' }, { status: 404 });
  }

  const db = scopedPrisma(tenant.id);
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, durationMinutes: true },
  });

  return NextResponse.json({ success: true, data: services });
}
