/**
 * Seed default services for tenants that have none.
 * Run: npx tsx scripts/seed-tenant-services.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { DEFAULT_SERVICES } from '../lib/tenant/defaults';

function sanitizeDatabaseUrl(raw: string): string {
  return raw
    .replace(/([?&])sslmode=[^&]*&/g, '$1')
    .replace(/([?&])sslmode=[^&]*$/g, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '');
}

async function main() {
  const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DIRECT_URL or DATABASE_URL required');

  const pool = new Pool({
    connectionString: sanitizeDatabaseUrl(databaseUrl),
    ssl: { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const tenants = await prisma.tenant.findMany({ select: { id: true, slug: true } });

  for (const tenant of tenants) {
    const count = await prisma.service.count({ where: { tenantId: tenant.id } });
    if (count > 0) {
      console.log(`Skip ${tenant.slug} — already has services`);
      continue;
    }
    await prisma.service.createMany({
      data: DEFAULT_SERVICES.map((s) => ({
        tenantId: tenant.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        sortOrder: s.sortOrder,
      })),
    });
    console.log(`Created default services for ${tenant.slug}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
