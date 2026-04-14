import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
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
    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
      },
      include: { plan: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.student.delete({ where: { id } });
  }

  // Calcula si el alumno está en mora según día de cobro y último pago
  private withPaymentStatus(student: any) {
    const today = new Date();
    const lastPayment = student.payments?.[0];
    let isOverdue = false;
    let nextDueDate: Date | null = null;

    if (lastPayment) {
      nextDueDate = new Date(lastPayment.periodEnd);
      isOverdue = nextDueDate < today;
    } else {
      // Sin pagos: calcular desde joinDate + billingDay
      const due = new Date(student.joinDate);
      due.setDate(student.billingDay);
      if (due < student.joinDate) due.setMonth(due.getMonth() + 1);
      nextDueDate = due;
      isOverdue = due < today;
    }

    return { ...student, isOverdue, nextDueDate };
  }
}
