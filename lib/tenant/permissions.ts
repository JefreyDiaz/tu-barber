export function canManageBarber(
  session: { user?: { role?: string; id?: string; tenantId?: string | null } },
  barberId: string
): boolean {
  if (!session.user) return false;
  if (session.user.role === 'super_admin' || session.user.role === 'admin') return true;
  return session.user.id === barberId;
}

export function isPlatformAdmin(role?: string): boolean {
  return role === 'super_admin';
}

export function isTenantAdmin(role?: string): boolean {
  return role === 'admin' || role === 'dueno';
}

export function canViewAllBookings(role?: string): boolean {
  return role === 'admin' || role === 'dueno' || role === 'super_admin';
}

export function assertSameTenant(
  sessionTenantId: string | null | undefined,
  resourceTenantId: string
): boolean {
  if (!sessionTenantId) return false;
  return sessionTenantId === resourceTenantId;
}
