import { IsNumber, IsOptional, IsBoolean, IsDecimal, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalesDepartmentDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsNumber()
  employeeId: number;

  @ApiPropertyOptional({ description: 'Number of leads closed', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadsClosed?: number;

  @ApiPropertyOptional({ description: 'Total sales amount' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  salesAmount?: number;

  @ApiPropertyOptional({ description: 'Sales unit ID' })
  @IsOptional()
  @IsNumber()
  salesUnitId?: number;

  @ApiPropertyOptional({ description: 'Commission rate in percentage', minimum: 0, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Commission amount', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  commissionAmount?: number;

  @ApiPropertyOptional({ description: 'Sales bonus', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  salesBonus?: number;

  @ApiProperty({ description: 'Withhold commission amount', minimum: 0 })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  withholdCommission: number;

  @ApiProperty({ description: 'Flag indicating whether commission is withheld' })
  @IsBoolean()
  withholdFlag: boolean;

  @ApiPropertyOptional({ description: 'Target amount', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ description: 'Chargeback deductions', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  chargebackDeductions?: number;

  @ApiPropertyOptional({ description: 'Refund deductions', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  refundDeductions?: number;
}

export class UpdateCommissionRateDto {
  @ApiProperty({ description: 'Updated commission rate in percentage', minimum: 0, maximum: 100 })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  @Max(100)
  commissionRate: number;
}

export class UpdateTargetAmountDto {
  @ApiProperty({ description: 'Updated target amount', minimum: 0 })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  targetAmount: number;
}

export class UpdateSalesDepartmentDto {
  @ApiPropertyOptional({ description: 'Number of leads closed', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadsClosed?: number;

  @ApiPropertyOptional({ description: 'Total sales amount' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  salesAmount?: number;

  @ApiPropertyOptional({ description: 'Sales unit ID' })
  @IsOptional()
  @IsNumber()
  salesUnitId?: number;

  @ApiPropertyOptional({ description: 'Commission rate in percentage', minimum: 0, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Commission amount', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  commissionAmount?: number;

  @ApiPropertyOptional({ description: 'Sales bonus', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  salesBonus?: number;

  @ApiPropertyOptional({ description: 'Withhold commission amount', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  withholdCommission?: number;

  @ApiPropertyOptional({ description: 'Flag indicating whether commission is withheld' })
  @IsOptional()
  @IsBoolean()
  withholdFlag?: boolean;

  @ApiPropertyOptional({ description: 'Target amount', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ description: 'Chargeback deductions', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  chargebackDeductions?: number;

  @ApiPropertyOptional({ description: 'Refund deductions', minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @Min(0)
  refundDeductions?: number;
}