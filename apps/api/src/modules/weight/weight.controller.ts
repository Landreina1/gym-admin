import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WeightService } from './weight.service';
import { CreateWeightDto } from './dto/create-weight.dto';

@ApiTags('Registros de Peso')
@Controller('weight')
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nuevo peso para un alumno' })
  create(@Body() dto: CreateWeightDto) {
    return this.weightService.create(dto);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Historial y evolución de peso de un alumno' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.weightService.findByStudent(studentId);
  }
}
