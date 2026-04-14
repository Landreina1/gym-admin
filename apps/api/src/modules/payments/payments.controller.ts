import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar pago manualmente' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Alumnos en mora' })
  findOverdue() {
    return this.paymentsService.findOverdue();
  }

  @Get('due-soon')
  @ApiOperation({ summary: 'Alumnos con vencimiento próximo' })
  findDueSoon(@Query('days') days?: number) {
    return this.paymentsService.findDueSoon(days);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de pagos (KPIs + gráficas)' })
  getStats() {
    return this.paymentsService.getStats();
  }

  @Get('all-students')
  @ApiOperation({ summary: 'Todos los alumnos activos con estado de pago' })
  findAllStudentsForPayments() {
    return this.paymentsService.findAllStudentsForPayments();
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Historial de pagos de un alumno' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.paymentsService.findByStudent(studentId);
  }

  @Post(':studentId/mark-overdue')
  @ApiOperation({ summary: 'Marcar alumno en mora' })
  markOverdue(@Param('studentId') studentId: string) {
    return this.paymentsService.markOverdue(studentId);
  }
}
