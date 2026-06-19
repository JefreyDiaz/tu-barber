/**
 * One-time script: migrate existing single-tenant data to default tenant.
 * Run: npx tsx scripts/migrate-to-multitenant.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { DEFAULT_SCHEDULE, DEFAULT_TENANT_SLUG } from '../lib/tenant/defaults';

async function main() {
  const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DIRECT_URL or DATABASE_URL required');

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const existing = await prisma.tenant.findUnique({ where: { slug: DEFAULT_TENANT_SLUG } });
  if (existing) {
    console.log('Default tenant already exists:', existing.id);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug: DEFAULT_TENANT_SLUG,
      name: 'The Barber House',
      status: 'active',
      plan: 'pro',
      settings: {
        create: {
          scheduleJson: DEFAULT_SCHEDULE,
          slotDurationMinutes: 40,
        },
      },
    },
  });

  console.log('Created tenant:', tenant.id);

  // Assign tenantId to all users without tenant
  const usersUpdated = await prisma.$executeRaw`
    UPDATE "User" SET "tenantId" = ${tenant.id} WHERE "tenantId" IS NULL AND "role" != 'super_admin'
  `;
  console.log('Users updated:', usersUpdated);

  const bookingsUpdated = await prisma.$executeRaw`
    UPDATE "Booking" SET "tenantId" = ${tenant.id} WHERE "tenantId" IS NULL OR "tenantId" = ''
  `;
  console.log('Bookings updated:', bookingsUpdated);

  const slotsUpdated = await prisma.$executeRaw`
    UPDATE "BlockedSlot" SET "tenantId" = ${tenant.id} WHERE "tenantId" IS NULL OR "tenantId" = ''
  `;
  console.log('BlockedSlots updated:', slotsUpdated);

  await prisma.$disconnect();
  await pool.end();
  console.log('Migration complete.');
}

main().catch(console.error);
