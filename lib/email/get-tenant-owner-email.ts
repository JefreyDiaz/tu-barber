import { prisma } from '@/lib/prisma';

export async function getTenantOwnerEmail(tenantId: string): Promise<string | null> {
  const onboarding = await prisma.tenantOnboarding.findUnique({
    where: { tenantId },
    select: { ownerEmail: true },
  });
  const email = onboarding?.ownerEmail?.trim();
  return email || null;
}
