/** Routes that must render even when tenant.status !== active (no redirect loop). */
export const TENANT_STATUS_EXEMPT_PATHS = ['/tenant-status', '/tenant-not-found'] as const;

export function isTenantStatusExemptPath(pathname: string): boolean {
  return TENANT_STATUS_EXEMPT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
