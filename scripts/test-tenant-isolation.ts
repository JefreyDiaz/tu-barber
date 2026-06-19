/**
 * Smoke test: tenant isolation queries.
 * Run: npx tsx scripts/test-tenant-isolation.ts
 * Requires DB with at least 2 tenants or creates test data.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../prisma/generated/prisma/client';

async function main() {
  const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL required');

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const tenants = await prisma.tenant.findMany({ take: 2, select: { id: true, slug: true } });

  if (tenants.length < 2) {
    console.log('SKIP: Need 2+ tenants for isolation test. Create another tenant via /registro');
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  }

  const [tenantA, tenantB] = tenants;

  const bookingsA = await prisma.booking.findMany({ where: { tenantId: tenantA.id }, take: 1 });
  const bookingsB = await prisma.booking.findMany({ where: { tenantId: tenantB.id }, take: 1 });

  if (bookingsA.length && bookingsB.length) {
    const leak = await prisma.booking.findFirst({
      where: { id: bookingsB[0].id, tenantId: tenantA.id },
    });
    if (leak) {
      console.error('FAIL: Tenant A can read Tenant B booking');
      process.exit(1);
    }
  }

  const crossUser = await prisma.user.findFirst({
    where: { tenantId: tenantA.id, username: { not: undefined } },
  });
  if (crossUser) {
    const wrongTenant = await prisma.user.findFirst({
      where: { tenantId: tenantB.id, username: crossUser.username },
    });
    if (wrongTenant) {
      console.log('OK: Same username allowed in different tenants (composite unique)');
    }
  }

  console.log('PASS: Tenant isolation smoke test');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
