import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationStatus } from '@prisma/client';

export class CreateNotificationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(status?: NotificationStatus) {
    return this.prisma.notification.findMany({
      where: { ...(status && { status }) },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: NotificationStatus) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notificación no encontrada');

    return this.prisma.notification.update({
      where: { id },
      data: {
        status,
        ...(status === 'SENT' && { sentAt: new Date() }),
      },
    });
  }

  // Genera notificaciones automáticas para pagos próximos (llamado desde un cron futuro)
  async generatePaymentDueNotifications() {
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);
    const today = new Date();

    const students = await this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        payments: {
          some: {
            periodEnd: { gte: today, lte: in2Days },
          },
        },
      },
      include: {
        payments: {
          where: { periodEnd: { gte: today, lte: in2Days } },
          orderBy: { periodEnd: 'asc' },
          take: 1,
        },
      },
    });

    const created = await Promise.all(
      students.map((s) =>
        this.prisma.notification.create({
          data: {
            studentId: s.id,
            type: 'PAYMENT_DUE',
            title: `Pago próximo: ${s.firstName} ${s.lastName}`,
            message: `El pago de ${s.firstName} ${s.lastName} vence en 2 días.`,
            status: 'PENDING',
          },
        }),
      ),
    );

    return { generated: created.length };
  }
}
