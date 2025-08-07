import { IsNumber, IsOptional, IsBoolean, IsDecimal, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSalesDepartmentDto {
  @IsNumber()
  employeeId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  leadsClosed?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  salesAmount?: number;

  @IsOptional()
  @IsNumber()
  salesUnitId?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  commissionAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  salesBonus?: number;

  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  withholdCommission: number;

  @IsBoolean()
  withholdFlag: boolean;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  targetAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  chargebackDeductions?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  refundDeductions?: number;
}

export class UpdateCommissionRateDto {
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  @Max(100)
  commissionRate: number;
}

export class UpdateTargetAmountDto {
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  targetAmount: number;
}

export class UpdateSalesDepartmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadsClosed?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  salesAmount?: number;

  @IsOptional()
  @IsNumber()
  salesUnitId?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  commissionAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  salesBonus?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  withholdCommission?: number;

  @IsOptional()
  @IsBoolean()
  withholdFlag?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  targetAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  chargebackDeductions?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  refundDeductions?: number;
} 