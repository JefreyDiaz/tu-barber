import { prisma } from '@/lib/prisma';
import { hashPassword, generateTemporaryPassword } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset';
import { forgotPasswordSchema } from '@/lib/validations/password-reset';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';

const GENERIC_SUCCESS =
  'Si el correo está registrado en esta barbería, recibirás una contraseña temporal en unos minutos.';

async function findUserByEmailForTenant(tenantId: string, email: string) {
  const normalized = email.trim().toLowerCase();

  const byUserEmail = await prisma.user.findFirst({
    where: {
      tenantId,
      isActive: true,
      email: { equals: normalized, mode: 'insensitive' },
    },
    include: { tenant: { select: { name: true, slug: true } } },
  });
  if (byUserEmail) return byUserEmail;

  return prisma.user.findFirst({
    where: {
      tenantId,
      isActive: true,
      role: 'dueno',
      tenant: {
        onboarding: { ownerEmail: { equals: normalized, mode: 'insensitive' } },
      },
    },
    include: { tenant: { select: { name: true, slug: true } } },
  });
}

export async function POST(request: Request) {
  try {
    const tenant = await requireApiTenant(request);
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, error: 'Correo inválido' }, { status: 400 });
    }
    const email = parsed.data.email;

    const user = await findUserByEmailForTenant(tenant.id, email);

    if (user) {
      const temporaryPassword = generateTemporaryPassword();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashPassword(temporaryPassword),
          mustChangePassword: true,
          ...(user.email ? {} : { email }),
        },
      });

      const sent = await sendPasswordResetEmail({
        shopName: user.tenant.name,
        slug: user.tenant.slug,
        ownerName: user.name,
        toEmail: email,
        username: user.username,
        temporaryPassword,
      });

      if (!sent) {
        console.error('[forgot-password] Email failed for user', user.id);
      }
    }

    return Response.json({ success: true, message: GENERIC_SUCCESS });
  } catch (error) {
    return tenantApiErrorResponse(error);
  }
}
