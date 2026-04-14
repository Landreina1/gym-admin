import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Plans
  const [basic, premium, personal] = await Promise.all([
    prisma.plan.upsert({
      where: { id: 'plan-basic' },
      create: { id: 'plan-basic', name: 'Básico', description: 'Acceso a sala de musculación', price: 5000, durationDays: 30 },
      update: {},
    }),
    prisma.plan.upsert({
      where: { id: 'plan-premium' },
      create: { id: 'plan-premium', name: 'Premium', description: 'Acceso completo + clases grupales', price: 8000, durationDays: 30 },
      update: {},
    }),
    prisma.plan.upsert({
      where: { id: 'plan-personal' },
      create: { id: 'plan-personal', name: 'Personal Training', description: 'Entrenamiento personalizado', price: 15000, durationDays: 30 },
      update: {},
    }),
  ]);

  // Admin user
  await prisma.adminUser.upsert({
    where: { email: 'admin@gym.com' },
    create: {
      email: 'admin@gym.com',
      name: 'Admin Principal',
      password: 'hashed_password_here', // en producción: bcrypt hash
      role: 'ADMIN',
    },
    update: {},
  });

  // Sample students
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const students = [
    { firstName: 'María', lastName: 'González', email: 'maria@example.com', billingDay: 5, planId: premium.id, goal: 'LOSE_WEIGHT' as const, initialWeight: 75, height: 165 },
    { firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos@example.com', billingDay: 10, planId: basic.id, goal: 'GAIN_WEIGHT' as const, initialWeight: 65, height: 178 },
    { firstName: 'Ana', lastName: 'López', email: 'ana@example.com', billingDay: 15, planId: personal.id, goal: 'MAINTAIN' as const, initialWeight: 60, height: 160 },
    { firstName: 'Juan', lastName: 'Martínez', email: 'juan@example.com', billingDay: 20, planId: basic.id, goal: 'GAIN_WEIGHT' as const, initialWeight: 70, height: 180 },
    { firstName: 'Laura', lastName: 'Pérez', billingDay: 1, planId: premium.id, goal: 'LOSE_WEIGHT' as const, initialWeight: 80, height: 170 },
  ];

  for (const studentData of students) {
    const student = await prisma.student.upsert({
      where: { email: studentData.email ?? `${studentData.firstName.toLowerCase()}@noemail.com` },
      create: { ...studentData, status: 'ACTIVE' },
      update: {},
    });

    // Add weight records
    await prisma.weightRecord.createMany({
      data: [
        { studentId: student.id, weight: studentData.initialWeight, recordedAt: new Date(now.getFullYear(), now.getMonth() - 2, 1) },
        { studentId: student.id, weight: studentData.initialWeight - 1.5, recordedAt: lastMonth },
        { studentId: student.id, weight: studentData.initialWeight - 2.5, recordedAt: now },
      ],
      skipDuplicates: true,
    });

    // Add payment for last month
    const periodStart = lastMonth;
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: 5000,
        paidAt: lastMonth,
        periodStart,
        periodEnd,
        status: 'PAID',
      },
    });
  }

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
