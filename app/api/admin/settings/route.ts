import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tenantSettingsSchema } from '@/lib/validations/tenant';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { checkDomainVerification } from '@/lib/vercel/domains';
import { resolveTenantPlan, trialDaysLeft } from '@/lib/tenant/subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  const session = await auth();
  if (!session?.user || !assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const db = scopedPrisma(tenant.id);
  const settings = await db.settings.findUnique();
  const tenantData = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: { plan: true, customDomain: true, slug: true, subscriptionStatus: true, trialEndsAt: true },
  });

  let domainVerified = false;
  if (tenantData?.customDomain) {
    const v = await checkDomainVerification(tenantData.customDomain);
    domainVerified = v.verified;
  }

  const effectivePlan = tenantData
    ? resolveTenantPlan({
        plan: tenantData.plan,
        subscriptionStatus: tenantData.subscriptionStatus,
        trialEndsAt: tenantData.trialEndsAt,
      })
    : 'basic';

  return NextResponse.json({
    success: true,
    data: {
      tenantId: tenant.id,
      ...settings,
      plan: tenantData?.plan,
      effectivePlan,
      subscriptionStatus: tenantData?.subscriptionStatus,
      trialEndsAt: tenantData?.trialEndsAt?.toISOString() ?? null,
      trialDaysLeft: tenantData ? trialDaysLeft(tenantData) : null,
      customDomain: tenantData?.customDomain,
      slug: tenantData?.slug,
      domainVerified,
    },
  });
}

export async function PATCH(request: NextRequest) {
  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch (e) {
    return tenantApiErrorResponse(e);
  }

  const session = await auth();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'dueno')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = tenantSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.issues }, { status: 400 });
  }

  const db = scopedPrisma(tenant.id);
  const settings = await db.settings.upsert({
    create: { ...parsed.data, scheduleJson: parsed.data.scheduleJson ?? undefined },
    update: parsed.data,
  });

  return NextResponse.json({ success: true, data: { ...settings, tenantId: tenant.id } });
}
