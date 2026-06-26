import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tenantSettingsSchema } from '@/lib/validations/tenant';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { checkDomainVerification } from '@/lib/vercel/domains';
import { resolveTenantPlan, trialDaysLeft, canUseOwnTwilio } from '@/lib/tenant/subscription';

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
    : 'emprendedor';

  const ownTwilio = tenantData ? canUseOwnTwilio(tenantData) : false;

  return NextResponse.json({
    success: true,
    data: {
      tenantId: tenant.id,
      ...settings,
      plan: tenantData?.plan,
      effectivePlan,
      canUseOwnTwilio: ownTwilio,
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

  const tenantData = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: { plan: true, subscriptionStatus: true, trialEndsAt: true },
  });

  const twilioKeys = [
    'twilioAccountSid',
    'twilioAuthToken',
    'twilioWhatsappFrom',
    'twilioContentSidBooking',
    'twilioContentSidBarber',
    'twilioContentSidReminder',
  ] as const;

  const hasTwilioUpdate = twilioKeys.some((key) => parsed.data[key] !== undefined);
  const ownTwilio = tenantData ? canUseOwnTwilio(tenantData) : false;

  if (hasTwilioUpdate && !ownTwilio) {
    return NextResponse.json(
      {
        success: false,
        error: 'La configuración de Twilio está disponible solo en el plan Cadena.',
      },
      { status: 403 }
    );
  }

  const db = scopedPrisma(tenant.id);

  try {
    const payload = {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl?.trim() ? parsed.data.logoUrl.trim() : parsed.data.logoUrl === '' ? null : undefined,
      backgroundUrl: parsed.data.backgroundUrl?.trim()
        ? parsed.data.backgroundUrl.trim()
        : parsed.data.backgroundUrl === ''
          ? null
          : undefined,
    };

    const settings = await db.settings.upsert({
      create: { ...payload, scheduleJson: parsed.data.scheduleJson ?? undefined },
      update: payload,
    });

    return NextResponse.json({ success: true, data: { ...settings, tenantId: tenant.id } });
  } catch (error) {
    console.error('[admin/settings PATCH]', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar configuración. Reinicia el servidor de desarrollo.' },
      { status: 500 }
    );
  }
}
