import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBodyRecordDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waist?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  abdomen?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  arms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  legs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  glutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
