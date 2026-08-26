import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { changePasswordSchema } from '@/lib/validations/password-reset';
import { requireApiTenant, tenantApiErrorResponse } from '@/lib/tenant/api-helper';
import { assertSameTenant } from '@/lib/tenant/permissions';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await requireApiTenant(request);
    if (!assertSameTenant(session.user.tenantId, tenant.id)) {
      return Response.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        Object.values(parsed.error.flatten().fieldErrors).flat().join(' ') || 'Datos inválidos';
      return Response.json({ success: false, error: message }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { id: session.user.id, tenantId: tenant.id },
      select: { id: true, mustChangePassword: true },
    });

    if (!user) {
      return Response.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!user.mustChangePassword) {
      return Response.json(
        { success: false, error: 'No se requiere cambio de contraseña' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(parsed.data.password),
        mustChangePassword: false,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return tenantApiErrorResponse(error);
  }
}
