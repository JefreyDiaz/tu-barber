import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { onboardingSchema } from '@/lib/validations/tenant';
import { DEFAULT_SCHEDULE, DEFAULT_SERVICES } from '@/lib/tenant/defaults';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { shopName, slug, ownerName, ownerEmail, ownerPhone, username, password, plan } = parsed.data;

    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: 'Este slug ya está en uso' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: shopName,
        status: 'pending',
        plan,
        subscriptionStatus: 'none',
        settings: {
          create: { scheduleJson: DEFAULT_SCHEDULE },
        },
        services: {
          create: DEFAULT_SERVICES.map((s) => ({
            name: s.name,
            durationMinutes: s.durationMinutes,
            sortOrder: s.sortOrder,
          })),
        },
        onboarding: {
          create: { ownerName, ownerEmail, ownerPhone },
        },
        users: {
          create: {
            name: ownerName,
            username,
            password: hashedPassword,
            email: ownerEmail,
            phone: ownerPhone,
            role: 'dueno',
            isActive: false,
          },
        },
      },
      select: { id: true, slug: true, name: true, status: true },
    });

    return NextResponse.json({ success: true, data: tenant }, { status: 201 });
  } catch (error) {
    console.error('[onboarding]', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar barbería' },
      { status: 500 }
    );
  }
}
