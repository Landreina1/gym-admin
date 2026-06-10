import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    if (dto.cedula) {
      const conflict = await this.prisma.student.findFirst({ where: { cedula: dto.cedula } });
      if (conflict) throw new ConflictException(`Ya existe un alumno registrado con la cédula ${dto.cedula}`);
    }

    return this.prisma.student.create({
      data: {
        ...dto,
        email:     dto.email     ? dto.email     : undefined,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        joinDate:  dto.joinDate  ? new Date(dto.joinDate)  : undefined,
      },
      include: { plan: true },
    });
  }

  async findAll(query: QueryStudentDto) {
    const { search, status, planId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      ...(status && { status }),
      ...(planId && { planId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          plan: true,
          weightRecords: { orderBy: { recordedAt: 'desc' }, take: 2 },
          payments: { orderBy: { paidAt: 'desc' }, take: 20 },
        },
        orderBy: { lastName: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students.map((s) => this.withPaymentStatus(s)),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        plan: true,
        weightRecords: { orderBy: { recordedAt: 'desc' } },
        payments: { orderBy: { paidAt: 'desc' }, take: 10 },
      },
    });

    if (!student) throw new NotFoundException(`Alumno ${id} no encontrado`);
    return this.withPaymentStatus(student);
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);

    if (dto.cedula) {
      const conflict = await this.prisma.student.findFirst({
        where: { cedula: dto.cedula, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe un alumno registrado con la cédula ${dto.cedula}`);
    }

    // Build data explicitly so undefined fields are skipped and empty strings don't
    // violate the email @unique constraint
    const { birthDate, joinDate, email, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };

    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
    if (joinDate  !== undefined) data.joinDate  = joinDate  ? new Date(joinDate)  : undefined;
    if (email     !== undefined) data.email     = email     || null;

    return this.prisma.student.update({
      where: { id },
      data,
      include: { plan: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.student.delete({ where: { id } });
  }

  private withPaymentStatus(student: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payments: any[] = student.payments ?? [];

    if (payments.length === 0) {
      const due = new Date(student.joinDate);
      due.setDate(student.billingDay);
      if (due < new Date(student.joinDate)) due.setMonth(due.getMonth() + 1);
      return {
        ...student,
        isOverdue: due < today,
        paymentStatus: 'OVERDUE' as const,
        nextDueDate: due,
        pendingBalance: null,
        currentPeriodEnd: null,
      };
    }

    // Only consider periods that haven't expired
    const activePmts = payments.filter((p: any) => new Date(p.periodEnd) >= today);

    if (activePmts.length === 0) {
      return {
        ...student,
        isOverdue: true,
        paymentStatus: 'OVERDUE' as const,
        nextDueDate: new Date(payments[0].periodEnd),
        pendingBalance: null,
        currentPeriodEnd: null,
      };
    }

    // Find the latest active period
    const latestEnd = activePmts.reduce((latest: Date, p: any) => {
      const d = new Date(p.periodEnd);
      return d > latest ? d : latest;
    }, new Date(0));
    const latestKey = latestEnd.toISOString().slice(0, 10);

    // All payments belonging to that period
    const periodPmts = activePmts.filter(
      (p: any) => new Date(p.periodEnd).toISOString().slice(0, 10) === latestKey,
    );

    const totalPaid = periodPmts.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const totalAmount = Number(periodPmts[0].totalAmount ?? periodPmts[0].amount);
    const isPaid = totalAmount <= 0 || totalPaid >= totalAmount - 0.01;

    return {
      ...student,
      isOverdue: !isPaid,
      paymentStatus: (isPaid ? 'UP_TO_DATE' : 'PARTIAL') as 'UP_TO_DATE' | 'PARTIAL',
      nextDueDate: latestEnd,
      pendingBalance: isPaid ? 0 : Math.max(0, totalAmount - totalPaid),
      currentPeriodEnd: latestKey,
    };
  }
}
