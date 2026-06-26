/** Fallback when tenant has no active services configured */
export const DEFAULT_SLOT_STEP_MINUTES = 30;

export function minServiceDurationMinutes(
  services: ReadonlyArray<{ durationMinutes: number }>
): number | null {
  if (services.length === 0) return null;
  return Math.min(...services.map((s) => s.durationMinutes));
}

/**
 * Grid step for blocking slots and booking start times.
 * Uses the shortest active service duration so the agenda matches real appointments.
 */
export function resolveSlotStepMinutes(
  services: ReadonlyArray<{ durationMinutes: number }>,
  tenantSlotDuration?: number | null
): number {
  const fromServices = minServiceDurationMinutes(services);
  if (fromServices != null) return fromServices;
  if (tenantSlotDuration != null && tenantSlotDuration > 0) return tenantSlotDuration;
  return DEFAULT_SLOT_STEP_MINUTES;
}
