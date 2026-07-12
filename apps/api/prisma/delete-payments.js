// Borra TODOS los pagos (deja la tabla en 0). Destructivo.
// Correr SIEMPRE después de un respaldo (apps/api/prisma/backup.js).
// Uso: DATABASE_URL=... node apps/api/prisma/delete-payments.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const before = await prisma.payment.count();
  const res = await prisma.payment.deleteMany({});
  const after = await prisma.payment.count();
  console.log(`Pagos antes: ${before} | borrados: ${res.count} | ahora: ${after}`);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
