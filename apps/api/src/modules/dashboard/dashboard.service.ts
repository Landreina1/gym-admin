import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      recentWeights,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.student.count({ where: { status: 'INACTIVE' } }),
      this.prisma.weightRecord.findMany({
        orderBy: { recordedAt: 'desc' },
        take: 20,
        include: {
          student: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    // Alumnos activos sin pago vigente = en mora
    const overdueStudents = await this.prisma.student.count({
      where: {
        status: 'ACTIVE',
        payments: {
          none: { periodEnd: { gte: today } },
        },
      },
    });

    // Alumnos con pagos al día
    const upToDateStudents = activeStudents - overdueStudents;

    // Próximos vencimientos (en los próximos 3 días)
    const dueSoon = await this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        payments: {
          some: {
            periodEnd: { gte: today, lte: in3Days },
          },
        },
      },
      include: {
        plan: { select: { name: true } },
        payments: {
          where: { periodEnd: { gte: today, lte: in3Days } },
          orderBy: { periodEnd: 'asc' },
          take: 1,
          select: { periodEnd: true, amount: true },
        },
      },
      take: 10,
    });

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
