import { maxBarbersForPlan, type TenantSubscription } from '@/lib/tenant/subscription';
import type { scopedPrisma } from '@/lib/tenant/prisma-scoped';

type ScopedDb = ReturnType<typeof scopedPrisma>;

export function usesBarberSlot(role: string): boolean {
  return role === 'barbero' || role === 'dueno';
}

export async function countBarberSlots(db: ScopedDb): Promise<number> {
  return db.user.count({
    where: { role: { in: ['barbero', 'dueno'] } },
  });
}

export function barberLimitExceededMessage(maxBarbers: number): string {
  return `Tu plan permite máximo ${maxBarbers} barbero(s). Actualiza tu plan para agregar más.`;
}

/**
 * Validates barber/dueno slot capacity when creating a user or changing role.
 * Reuses plan limits from lib/plans.ts (1 / 2 / 5 barberos).
 */
export async function validateBarberSlotCapacity(
  db: ScopedDb,
  tenant: TenantSubscription,
  options: { role: string; existingRole?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const willUseSlot = usesBarberSlot(options.role);
  const alreadyHadSlot = options.existingRole ? usesBarberSlot(options.existingRole) : false;

  if (!willUseSlot || alreadyHadSlot) {
    return { ok: true };
  }

  const maxBarbers = maxBarbersForPlan(tenant);
  const barberCount = await countBarberSlots(db);

  if (barberCount >= maxBarbers) {
    return { ok: false, error: barberLimitExceededMessage(maxBarbers) };
  }

  return { ok: true };
}
