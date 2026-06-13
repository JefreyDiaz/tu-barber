import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../prisma/generated/prisma/client';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== Limpieza de BlockedSlots ===\n');

  // Obtener todos los registros
  const allBlocks = await prisma.blockedSlot.findMany({
    orderBy: { date: 'desc' },
  });
  console.log(`Total registros: ${allBlocks.length}\n`);

  // Mostrar todos los registros
  allBlocks.forEach((b) => {
    console.log(
      `  id=${b.id.slice(0, 8)}  date=${b.date.toISOString()}  time=${b.time ?? 'null'}  fullDay=${b.isFullDay}  barber=${b.barberId.slice(0, 8)}`
    );
  });

  // Eliminar TODOS los registros viejos y dejar limpio
  console.log('\nEliminando todos los registros para empezar limpio...');
  const deleted = await prisma.blockedSlot.deleteMany({});
  console.log(`Eliminados: ${deleted.count} registros`);

  console.log('\nListo! La tabla BlockedSlot está limpia.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
