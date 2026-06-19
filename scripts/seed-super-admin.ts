/**
 * Seed super_admin user for platform management.
 * Run: npx tsx scripts/seed-super-admin.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { hashPassword } from '../lib/password';

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

  const connectionString = sanitizeDatabaseUrl(databaseUrl);
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const username = process.env.SUPER_ADMIN_USERNAME ?? 'superadmin';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin123!';

  const existing = await prisma.user.findFirst({
    where: { role: 'super_admin', tenantId: null },
  });

  if (existing) {
    console.log('super_admin already exists:', existing.username);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const hashed = await hashPassword(password);

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      username,
      password: hashed,
      role: 'super_admin',
      tenantId: null,
      isActive: true,
    },
  });

  console.log('Created super_admin:', username);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
