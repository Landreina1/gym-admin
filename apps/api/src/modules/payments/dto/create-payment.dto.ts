import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Fecha en que se realizó el pago' })
  @IsDateString()
  paidAt: string;

  @ApiProperty({ description: 'Inicio del período que cubre' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Fin del período que cubre' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.PAID })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentType, default: PaymentType.FULL })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
