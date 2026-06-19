import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkDomainVerification } from '@/lib/vercel/domains';

/** GET /api/platform/tenants/[id]/domain — check DNS verification status */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { id } });

  if (!tenant?.customDomain) {
    return NextResponse.json({ success: false, error: 'Sin dominio configurado' }, { status: 404 });
  }

  const isSuperAdmin = session.user.role === 'super_admin';
  const isTenantAdmin =
    session.user.tenantId === id && (session.user.role === 'admin' || session.user.role === 'dueno');

  if (!isSuperAdmin && !isTenantAdmin) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  const result = await checkDomainVerification(tenant.customDomain);

  return NextResponse.json({
    success: true,
    data: { verified: result.verified, domain: tenant.customDomain },
    verification: result.verification,
  });
}
