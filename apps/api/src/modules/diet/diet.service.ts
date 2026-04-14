import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDietTemplateDto, UpdateDietTemplateDto, AssignDietDto, UpdateStudentDietDto } from './dto/diet.dto';

@Injectable()
export class DietService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Templates ──────────────────────────────────────────────

  async getAllTemplates() {
    return this.prisma.dietTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: string) {
    const t = await this.prisma.dietTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Plantilla no encontrada');
    return t;
  }

  async createTemplate(dto: CreateDietTemplateDto) {
    return this.prisma.dietTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        meals: dto.meals.map((m) => ({ ...m })) as any,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateDietTemplateDto) {
    await this.getTemplate(id);
    return this.prisma.dietTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.meals !== undefined && { meals: dto.meals.map((m) => ({ ...m })) as any }),
      },
    });
  }

  async deleteTemplate(id: string) {
    await this.getTemplate(id);
    return this.prisma.dietTemplate.delete({ where: { id } });
  }

  // ── Student diets ──────────────────────────────────────────

  async getStudentDiet(studentId: string) {
    return this.prisma.studentDiet.findUnique({
      where: { studentId },
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async assignDiet(dto: AssignDietDto) {
    const meals = dto.meals.map((m) => ({ ...m })) as any;
    return this.prisma.studentDiet.upsert({
      where: { studentId: dto.studentId },
      create: {
        studentId: dto.studentId,
        templateId: dto.templateId,
        name: dto.name,
        meals,
        notes: dto.notes,
      },
      update: {
        templateId: dto.templateId,
        name: dto.name,
        meals,
        notes: dto.notes,
      },
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async updateStudentDiet(studentId: string, dto: UpdateStudentDietDto) {
    const existing = await this.getStudentDiet(studentId);
    if (!existing) throw new NotFoundException('El alumno no tiene dieta asignada');
    return this.prisma.studentDiet.update({
      where: { studentId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.meals !== undefined && { meals: dto.meals.map((m) => ({ ...m })) as any }),
      },
    });
  }

  async removeStudentDiet(studentId: string) {
    return this.prisma.studentDiet.delete({ where: { studentId } });
  }
}
