/** Request header names — edge-safe (no Node/Prisma imports). */
export const TENANT_HEADERS = {
  id: 'x-tenant-id',
  slug: 'x-tenant-slug',
  status: 'x-tenant-status',
  name: 'x-tenant-name',
  pathname: 'x-pathname',
} as const;

export const TENANT_SLUG_HEADER = TENANT_HEADERS.slug;
export const TENANT_PLATFORM_HEADER = 'x-is-platform';
export const TENANT_PATHNAME_HEADER = TENANT_HEADERS.pathname;
