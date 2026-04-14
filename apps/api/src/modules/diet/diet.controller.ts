import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { DietService } from './diet.service';
import { CreateDietTemplateDto, UpdateDietTemplateDto, AssignDietDto, UpdateStudentDietDto } from './dto/diet.dto';

@Controller('diets')
export class DietController {
  constructor(private readonly diet: DietService) {}

  // Templates
  @Get('templates')
  getAll() { return this.diet.getAllTemplates(); }

  @Get('templates/:id')
  getOne(@Param('id') id: string) { return this.diet.getTemplate(id); }

  @Post('templates')
  create(@Body() dto: CreateDietTemplateDto) { return this.diet.createTemplate(dto); }

  @Patch('templates/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDietTemplateDto) { return this.diet.updateTemplate(id, dto); }

  @Delete('templates/:id')
  remove(@Param('id') id: string) { return this.diet.deleteTemplate(id); }

  // Student diets
  @Get('student/:studentId')
  getStudentDiet(@Param('studentId') studentId: string) { return this.diet.getStudentDiet(studentId); }

  @Post('student')
  assign(@Body() dto: AssignDietDto) { return this.diet.assignDiet(dto); }

  @Patch('student/:studentId')
  updateStudentDiet(@Param('studentId') studentId: string, @Body() dto: UpdateStudentDietDto) {
    return this.diet.updateStudentDiet(studentId, dto);
  }

  @Delete('student/:studentId')
  removeStudentDiet(@Param('studentId') studentId: string) { return this.diet.removeStudentDiet(studentId); }
}
