import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { NotificationStatus } from '@prisma/client';

@ApiTags('Notificaciones')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear notificación administrativa manual' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones' })
  findAll(@Query('status') status?: NotificationStatus) {
    return this.notificationsService.findAll(status);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de notificación' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: NotificationStatus,
  ) {
    return this.notificationsService.updateStatus(id, status);
  }

  @Post('generate-payment-due')
  @ApiOperation({ summary: 'Generar notificaciones de pagos próximos (simulado)' })
  generatePaymentDue() {
    return this.notificationsService.generatePaymentDueNotifications();
  }
}
