import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../prisma/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion?: string;
};

/** Bump when schema changes so dev hot-reload invalidates stale Prisma clients. */
const PRISMA_SCHEMA_VERSION = '20260626-logging';

/** sslmode in the URL overrides Pool ssl options and breaks Supabase on Windows (P1011). */
function sanitizeDatabaseUrl(raw: string): string {
  return raw
    .replace(/([?&])sslmode=[^&]*&/g, '$1')
    .replace(/([?&])sslmode=[^&]*$/g, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '');
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const connectionString = sanitizeDatabaseUrl(databaseUrl);
  const isLocal = /@(?:localhost|127\.0\.0\.1)(?::|\/)/.test(connectionString);

  const pool = new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);

  const prismaLog =
    process.env.PRISMA_LOG_QUERY === 'true'
      ? (['query', 'error', 'warn'] as const)
      : process.env.NODE_ENV === 'development'
        ? (['error', 'warn'] as const)
        : (['error'] as const);

  return new PrismaClient({
    adapter,
    log: [...prismaLog],
  });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return client;
}

export const prisma = getPrismaClient();
