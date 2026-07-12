// Setea el username del admin sin tocar la contraseña. Usa SQL directo
// para no depender de regenerar el cliente Prisma.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USERNAME = process.env.NEW_USERNAME || 'elcuba';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gym.com';

(async () => {
  const rows = await prisma.$executeRawUnsafe(
    'UPDATE admin_users SET username = $1 WHERE email = $2',
    USERNAME,
    EMAIL,
  );
  const check = await prisma.$queryRawUnsafe(
    'SELECT email, username, name, role FROM admin_users',
  );
  console.log('Filas actualizadas:', rows);
  console.log('Admins:', JSON.stringify(check, null, 2));
  await prisma.$disconnect();
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
