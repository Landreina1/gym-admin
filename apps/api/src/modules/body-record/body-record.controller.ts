import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { BodyRecordService } from './body-record.service';
import { CreateBodyRecordDto } from './dto/body-record.dto';

@Controller('body-records')
export class BodyRecordController {
  constructor(private readonly service: BodyRecordService) {}

  @Get('student/:studentId')
  getByStudent(@Param('studentId') studentId: string) {
    return this.service.getByStudent(studentId);
  }

  @Post()
  create(@Body() dto: CreateBodyRecordDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
