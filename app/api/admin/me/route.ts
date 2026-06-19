import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireApiTenant } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';
import { scopedPrisma } from '@/lib/tenant/prisma-scoped';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const profileSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos')
    .transform((s) => '+57' + s),
  photo: z.union([z.string().url().max(1000), z.literal('')]).optional(),
  password: z.string().min(8).optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return NextResponse.json({ success: false, error: 'Barbería no encontrada' }, { status: 404 });
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  const db = scopedPrisma(tenant.id);
  const user = await db.user.findFirst({
    where: { id: session.user.id },
    select: {
      id: true, name: true, username: true, photo: true, phone: true, email: true, role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  let tenant;
  try {
    tenant = await requireApiTenant(request);
  } catch {
    return NextResponse.json({ success: false, error: 'Barbería no encontrada' }, { status: 404 });
  }

  if (!assertSameTenant(session.user.tenantId, tenant.id)) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    const message = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ') || 'Datos inválidos';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  const { name, phone, photo, password } = parsed.data;
  const db = scopedPrisma(tenant.id);

  const updateData: Record<string, unknown> = { name, phone };
  if (photo !== undefined) updateData.photo = photo || null;
  if (password && password.length >= 8) {
    updateData.password = await hashPassword(password);
  }

  await db.user.update({ where: { id: session.user.id }, data: updateData });

  const user = await db.user.findFirst({
    where: { id: session.user.id },
    select: {
      id: true, name: true, username: true, photo: true, phone: true, email: true, role: true,
    },
  });

  return NextResponse.json({ success: true, data: user });
}
