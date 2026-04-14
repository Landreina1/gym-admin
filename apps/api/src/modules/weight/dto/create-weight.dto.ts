import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWeightDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Peso en kg' })
  @IsNumber()
  weight: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Fecha del registro (default: hoy)' })
  @IsDateString()
  @IsOptional()
  recordedAt?: string;
}
