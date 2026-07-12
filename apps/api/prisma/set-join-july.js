// Pone la fecha de ingreso de TODOS los alumnos al 1 de julio 2026,
// para que (sin pagos) queden debiendo solo julio y no desde mayo.
// Correr después de un respaldo. Uso: DATABASE_URL=... node apps/api/prisma/set-join-july.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  for (const p of [path.join(process.cwd(), '.env'), path.join(__dirname, '..', '.env')]) {
    try { const m = fs.readFileSync(p, 'utf8').match(/^DATABASE_URL=(.*)$/m); if (m) { process.env.DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, ''); break; } } catch (_) {}
  }
}

const prisma = new PrismaClient();
// Mediodía UTC para que en UTC-4 (Venezuela) siga siendo el mismo día calendario.
const JULY = new Date('2026-07-01T12:00:00.000Z');

(async () => {
  const res = await prisma.student.updateMany({ data: { joinDate: JULY } });
  console.log('Alumnos actualizados (fecha de ingreso -> 2026-07-01):', res.count);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
