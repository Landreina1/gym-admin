import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWeightDto } from './dto/create-weight.dto';

@Injectable()
export class WeightService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWeightDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    return this.prisma.weightRecord.create({
      data: {
        studentId: dto.studentId,
        weight: dto.weight,
        notes: dto.notes,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
    });
  }

  async findByStudent(studentId: string) {
    const records = await this.prisma.weightRecord.findMany({
      where: { studentId },
      orderBy: { recordedAt: 'asc' },
    });

    if (!records.length) return { records: [], evolution: null };

    const first = records[0];
    const last = records[records.length - 1];
    const diff = Number(last.weight) - Number(first.weight);

    return {
      records,
      evolution: {
        initialWeight: first.weight,
        currentWeight: last.weight,
        difference: diff,
        trend: diff < 0 ? 'LOSING' : diff > 0 ? 'GAINING' : 'STABLE',
      },
    };
  }
}
