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

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      recentWeights,
      dueSoonRaw,
      overdueRaw,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.student.count({ where: { status: 'INACTIVE' } }),
      this.prisma.weightRecord.findMany({
        orderBy: { recordedAt: 'desc' },
        take: 20,
        include: { student: { select: { firstName: true, lastName: true } } },
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
            where: { periodEnd: { gte: today, lte: in3Days } },
            orderBy: { periodEnd: 'asc' },
            take: 1,
          },
        },
        take: 15,
      }),
      // OVERDUE: no active payment
      this.prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          payments: { none: { periodEnd: { gte: today } } },
        },
        include: {
          plan: planSelect,
          payments: { orderBy: { periodEnd: 'desc' }, take: 1 },
        },
        take: 15,
      }),
    ]);

    const overdueStudents = overdueRaw.length;
    const upToDateStudents = activeStudents - overdueStudents;

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
        overdue: overdueStudents,
      },
      dueSoon,
      recentWeightChanges: recentWeights,
    };
  }
}
