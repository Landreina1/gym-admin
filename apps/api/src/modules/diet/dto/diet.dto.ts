import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MealDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsString()
  foods: string;

  @IsOptional()
  @IsString()
  calories?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDietTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals: MealDto[];
}

export class UpdateDietTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals?: MealDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignDietDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals: MealDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStudentDietDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals?: MealDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
