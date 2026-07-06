import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    return this.prisma.payment.create({
      data: {
        studentId:     dto.studentId,
        amount:        dto.amount,
        paidAt:        new Date(dto.paidAt),
        periodStart:   new Date(dto.periodStart),
        periodEnd:     new Date(dto.periodEnd),
        status:        dto.status,
        paymentType:   dto.paymentType,
        paymentMethod: dto.paymentMethod,
        notes:         dto.notes,
      },
      include: { student: { select: { firstName: true, lastName: true } } },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.payment.findMany({
      where: { studentId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findOverdue() {
    const today = new Date();
    return this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        payments: {
          none: { periodEnd: { gte: today } },
        },
      },
      include: { plan: true },
      orderBy: { lastName: 'asc' },
    });
  }

  async findDueSoon(days: number = 3) {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    return this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        payments: {
          some: {
            periodEnd: { gte: today, lte: limit },
          },
        },
      },
      include: {
        plan: true,
        payments: {
          select: { periodEnd: true },
          where: { periodEnd: { gte: today, lte: limit } },
          orderBy: { periodEnd: 'asc' },
          take: 1,
        },
      },
    });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [paidThisMonth, recentPayments, overdueStudents, dueSoonStudents, totalActive] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: { paidAt: { gte: startOfMonth }, status: 'PAID' },
          _count: { id: true },
          _sum: { amount: true },
        }),
        this.prisma.payment.findMany({
          where: { paidAt: { gte: sixMonthsAgo }, status: 'PAID' },
          select: { paidAt: true, amount: true, paymentMethod: true },
        }),
        this.findOverdue(),
        this.findDueSoon(7),
        this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      ]);

    const monthlyMap = new Map<string, number>();
    recentPayments.forEach((p) => {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(p.amount));
    });

    const methodMap = new Map<string, { count: number; total: number }>();
    recentPayments.forEach((p) => {
      const method = p.paymentMethod ?? 'No especificado';
      const curr = methodMap.get(method) ?? { count: 0, total: 0 };
      methodMap.set(method, { count: curr.count + 1, total: curr.total + Number(p.amount) });
    });

    const upToDate = Math.max(0, totalActive - overdueStudents.length - dueSoonStudents.length);

    return {
      kpis: {
        overdue: overdueStudents.length,
        dueSoon: dueSoonStudents.length,
        paidThisMonth: paidThisMonth._count.id,
        revenueThisMonth: Number(paidThisMonth._sum.amount) || 0,
      },
      monthlyRevenue: Array.from(monthlyMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      methodDistribution: Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        ...data,
      })),
      statusDistribution: [
        { status: 'En mora', count: overdueStudents.length, color: '#ef4444' },
        { status: 'Próx. venc.', count: dueSoonStudents.length, color: '#f59e0b' },
        { status: 'Al día', count: upToDate, color: '#10b981' },
      ],
    };
  }

  async findAllStudentsForPayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const students = await this.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        plan: true,
        payments: { select: { id: true, periodEnd: true, amount: true, paidAt: true, paymentMethod: true }, orderBy: { paidAt: 'desc' }, take: 20 },
      },
      orderBy: { lastName: 'asc' },
    });

    return students.map((s) => {
      const payments = s.payments;
      let paymentStatus: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' | 'PARTIAL' = 'OVERDUE';
      let nextDueDate: string | null = null;
      let pendingBalance: number | null = null;
      let currentPeriodEnd: string | null = null;

      if (payments.length > 0) {
        const activePmts = payments.filter((p) => new Date(p.periodEnd) >= today);

        if (activePmts.length === 0) {
          nextDueDate = payments[0].periodEnd.toISOString();
          paymentStatus = 'OVERDUE';
        } else {
          const latestEnd = activePmts.reduce(
            (latest, p) => (p.periodEnd > latest ? p.periodEnd : latest),
            new Date(0),
          );
          const latestKey = latestEnd.toISOString().slice(0, 10);
          const periodPmts = activePmts.filter(
            (p) => p.periodEnd.toISOString().slice(0, 10) === latestKey,
          );

          nextDueDate = latestEnd.toISOString();
          currentPeriodEnd = latestKey;

          const totalPaid = periodPmts.reduce((sum, p) => sum + Number(p.amount), 0);
          const totalAmount = Number(periodPmts[0].amount);
          const isPaid = totalAmount <= 0 || totalPaid >= totalAmount - 0.01;

          if (!isPaid) {
            paymentStatus = 'PARTIAL';
            pendingBalance = Math.max(0, totalAmount - totalPaid);
          } else {
            pendingBalance = 0;
            const msLeft = latestEnd.getTime() - today.getTime();
            const daysLeft = msLeft / (1000 * 60 * 60 * 24);
            paymentStatus = daysLeft <= 7 ? 'DUE_SOON' : 'UP_TO_DATE';
          }
        }
      }

      const lastPmt = payments[0] ?? null;

      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        plan: s.plan,
        billingDay: s.billingDay,
        paymentStatus,
        nextDueDate,
        currentPeriodEnd,
        pendingBalance,
        lastPayment: lastPmt
          ? {
              id: lastPmt.id,
              amount: Number(lastPmt.amount),
              paidAt: lastPmt.paidAt.toISOString(),
              paymentMethod: lastPmt.paymentMethod,
            }
          : null,
      };
    });
  }

  async markOverdue(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const today = new Date();
    return this.prisma.payment.create({
      data: {
        studentId,
        amount: 0,
        paidAt: today,
        periodStart: today,
        periodEnd: today,
        status: 'OVERDUE',
        notes: 'Marcado en mora manualmente',
      },
    });
  }
}
