import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email: 'admin@gym.com' },
    create: {
      email: 'admin@gym.com',
      name: 'Admin Principal',
      password: hash,
      role: 'ADMIN',
    },
    update: { password: hash },
  });

  console.log('✅ Admin creado: admin@gym.com / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
