import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBodyRecordDto } from './dto/body-record.dto';

@Injectable()
export class BodyRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async getByStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const records = await this.prisma.bodyRecord.findMany({
      where: { studentId },
      orderBy: { recordedAt: 'asc' },
    });

    return { records, trackHeight: student.trackHeight };
  }

  async create(dto: CreateBodyRecordDto) {
    return this.prisma.bodyRecord.create({
      data: {
        studentId:  dto.studentId,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        weight:     dto.weight,
        height:     dto.height,
        waist:      dto.waist,
        abdomen:    dto.abdomen,
        arms:       dto.arms,
        legs:       dto.legs,
        glutes:     dto.glutes,
        notes:      dto.notes,
      },
    });
  }

  async delete(id: string) {
    const record = await this.prisma.bodyRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Registro no encontrado');
    return this.prisma.bodyRecord.delete({ where: { id } });
  }
}
