import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    in3Days.setHours(23, 59, 59, 999);

    const planSelect = { select: { id: true, name: true, price: true } };

    const overdueWhere = {
      status: 'ACTIVE' as const,
      payments: { none: { periodEnd: { gte: today } } },
    };

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      overdueCount,
      recentPayments,
      dueSoonRaw,
      overdueRaw,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.student.count({ where: { status: 'INACTIVE' } }),
      this.prisma.student.count({ where: overdueWhere }),
      // Historial global de pagos recientes
      this.prisma.payment.findMany({
        where: { amount: { gt: 0 } },
        orderBy: { paidAt: 'desc' },
        take: 12,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          paymentMethod: true,
          paymentType: true,
          student: { select: { firstName: true, lastName: true } },
        },
      }),
      // DUE_SOON: period ending in next 3 days
      this.prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          payments: { some: { periodEnd: { gte: today, lte: in3Days } } },
        },
        include: {
          plan: planSelect,
          payments: {
            select: { periodEnd: true },
            where: { periodEnd: { gte: today, lte: in3Days } },
            orderBy: { periodEnd: 'asc' },
            take: 1,
          },
        },
      }),
      // OVERDUE: no active payment — limited to 50 for display
      this.prisma.student.findMany({
        where: overdueWhere,
        include: {
          plan: planSelect,
          payments: { select: { periodEnd: true }, orderBy: { periodEnd: 'desc' }, take: 1 },
        },
        orderBy: { lastName: 'asc' },
        take: 50,
      }),
    ]);

    const upToDateStudents = Math.max(0, activeStudents - overdueCount);

    // Build unified dueSoon list: overdue first (most urgent), then expiring soon
    const dueSoon = [
      ...overdueRaw.map((s) => ({
        ...s,
        isOverdue: true,
        nextDueDate: s.payments[0]?.periodEnd ?? s.joinDate,
      })),
      ...dueSoonRaw.map((s) => ({
        ...s,
        isOverdue: false,
        nextDueDate: s.payments[0]?.periodEnd ?? null,
      })),
    ];

    return {
      totals: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        upToDate: upToDateStudents,
        overdue: overdueCount,
      },
      dueSoon,
      recentPayments,
    };
  }
}
