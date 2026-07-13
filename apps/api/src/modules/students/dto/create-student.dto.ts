import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsInt,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentGoal, StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Número de cédula' })
  @IsString()
  cedula: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Foto del alumno (data URL base64)' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  joinDate?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiProperty({ description: 'Día del mes de cobro (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  billingDay: number;

  @ApiProperty()
  @IsString()
  planId: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  initialWeight?: number;

  @ApiProperty({ enum: StudentGoal })
  @IsEnum(StudentGoal)
  goal: StudentGoal;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  monthlyGoalKg?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  // Salud
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCeliac?: boolean;

  // Medidas (cm)
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  waist?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  abdomen?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  arms?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  legs?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  glutes?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  trackHeight?: boolean;
}
