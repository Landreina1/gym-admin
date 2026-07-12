// Cambia la contraseña del admin (hash bcrypt) por SQL directo.
// Uso: NEW_PASSWORD=xxx ADMIN_USERNAME=elcuba node apps/api/prisma/set-password.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const NEW = process.env.NEW_PASSWORD || 'ElCuba2026';
const USER = process.env.ADMIN_USERNAME || 'elcuba';

(async () => {
  const hash = await bcrypt.hash(NEW, 10);
  const rows = await prisma.$executeRawUnsafe(
    'UPDATE admin_users SET password = $1 WHERE username = $2',
    hash,
    USER,
  );
  console.log(`Contraseña actualizada para "${USER}". Filas: ${rows}`);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
