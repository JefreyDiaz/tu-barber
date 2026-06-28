import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { customDomainSchema } from '@/lib/validations/tenant';
import { addDomainToVercel, checkDomainVerification } from '@/lib/vercel/domains';
import { canUseCustomDomain } from '@/lib/tenant/subscription';
import { sendTenantWelcomeMessage } from '@/lib/messaging/welcome';
import { notifyTenantApproved } from '@/lib/email/notify-tenant-approved';
import { startTrialEndDate } from '@/lib/tenant/subscription';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, rejectionNote, plan } = body as {
    action: 'approve' | 'reject' | 'suspend' | 'reactivate';
    rejectionNote?: string;
    plan?: string;
  };

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { onboarding: true },
  });
  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant no encontrado' }, { status: 404 });
  }

  if (action === 'approve') {
    const approvedPlan = plan ?? tenant.plan;
    const trialEndsAt = startTrialEndDate();
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id },
        data: {
          status: 'active',
          plan: approvedPlan,
          subscriptionStatus: 'trialing',
          trialEndsAt,
        },
      }),
      prisma.user.updateMany({
        where: { tenantId: id, role: 'dueno' },
        data: { isActive: true },
      }),
      prisma.tenantOnboarding.update({
        where: { tenantId: id },
        data: { reviewedAt: new Date(), reviewedById: session.user.id, rejectionNote: null },
      }),
    ]);

    if (tenant.onboarding) {
      const dueno = await prisma.user.findFirst({
        where: { tenantId: id, role: 'dueno' },
        select: { username: true },
      });

      await sendTenantWelcomeMessage({
        ownerPhone: tenant.onboarding.ownerPhone,
        ownerName: tenant.onboarding.ownerName,
        shopName: tenant.name,
        tenantSlug: tenant.slug,
        planId: approvedPlan,
        username: dueno?.username ?? '—',
      }).catch((err) => console.error('[welcome]', err));

      void notifyTenantApproved({
        shopName: tenant.name,
        slug: tenant.slug,
        plan: approvedPlan,
        ownerName: tenant.onboarding.ownerName,
        ownerEmail: tenant.onboarding.ownerEmail,
        username: dueno?.username ?? '—',
      });
    }
  } else if (action === 'reject') {
    await prisma.$transaction([
      prisma.tenant.update({ where: { id }, data: { status: 'rejected' } }),
      prisma.tenantOnboarding.update({
        where: { tenantId: id },
        data: {
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          rejectionNote: rejectionNote ?? 'Rechazado',
        },
      }),
    ]);
  } else if (action === 'suspend') {
    await prisma.tenant.update({ where: { id }, data: { status: 'suspended' } });
  } else if (action === 'reactivate') {
    await prisma.tenant.update({ where: { id }, data: { status: 'active' } });
  } else {
    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
  }

  const updated = await prisma.tenant.findUnique({
    where: { id },
    include: { onboarding: true },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = customDomainSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.issues }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant no encontrado' }, { status: 404 });
  }

  const isSuperAdmin = session.user.role === 'super_admin';
  const isTenantAdmin =
    session.user.tenantId === id && (session.user.role === 'admin' || session.user.role === 'dueno');

  if (!isSuperAdmin && !isTenantAdmin) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  if (!canUseCustomDomain(tenant) && !isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: 'Dominio personalizado requiere plan Pro' },
      { status: 403 }
    );
  }

  const existing = await prisma.tenant.findUnique({
    where: { customDomain: parsed.data.customDomain },
  });
  if (existing && existing.id !== id) {
    return NextResponse.json({ success: false, error: 'Dominio ya en uso' }, { status: 409 });
  }

  const vercelResult = await addDomainToVercel(parsed.data.customDomain);

  const updated = await prisma.tenant.update({
    where: { id },
    data: { customDomain: parsed.data.customDomain },
  });

  return NextResponse.json({
    success: true,
    data: { ...updated, domainVerified: vercelResult.verified },
    verification: vercelResult.verification,
    hint: vercelResult.verified
      ? 'Dominio verificado'
      : vercelResult.error ??
        'Agrega los registros DNS indicados y usa Verificar DNS cuando estén propagados',
  });
}
