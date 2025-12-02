import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SalaryDeductionDto {
  @ApiPropertyOptional({
    description: 'Employee ID to filter deductions',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  employeeId?: number;

  @ApiPropertyOptional({
    description: 'Month for which deductions are calculated in YYYY-MM format',
    example: '2025-10',
  })
  @IsOptional()
  @IsString()
  month?: string; // Format: YYYY-MM

  @ApiPropertyOptional({
    description: 'Start date for custom date range filter',
    example: '2025-10-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom date range filter',
    example: '2025-10-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DeductionCalculationDto {
  @ApiProperty({ description: 'Employee ID', example: 123 })
  employeeId: number;

  @ApiProperty({ description: 'Employee full name', example: 'John Doe' })
  employeeName: string;

  @ApiProperty({ description: 'Base monthly salary', example: 50000 })
  baseSalary: number;

  @ApiProperty({ description: 'Salary per day', example: 2000 })
  perDaySalary: number;

  @ApiProperty({
    description: 'Month of calculation in YYYY-MM format',
    example: '2025-10',
  })
  month: string;

  @ApiProperty({ description: 'Total days present', example: 20 })
  totalPresent: number;

  @ApiProperty({ description: 'Total days absent', example: 2 })
  totalAbsent: number;

  @ApiProperty({ description: 'Total late days', example: 1 })
  totalLateDays: number;

  @ApiProperty({ description: 'Total half days', example: 1 })
  totalHalfDays: number;

  @ApiProperty({
    description: 'Late days counted in monthly calculations',
    example: 1,
  })
  monthlyLatesDays: number;

  @ApiProperty({ description: 'Deduction for absent days', example: 4000 })
  absentDeduction: number;

  @ApiProperty({ description: 'Deduction for late days', example: 500 })
  lateDeduction: number;

  @ApiProperty({ description: 'Deduction for half days', example: 1000 })
  halfDayDeduction: number;

  @ApiProperty({ description: 'Chargeback deduction', example: 0 })
  chargebackDeduction: number;

  @ApiProperty({ description: 'Refund deduction', example: 0 })
  refundDeduction: number;

  @ApiProperty({ description: 'Total deduction for the month', example: 5500 })
  totalDeduction: number;

  @ApiProperty({ description: 'Net salary after deductions', example: 44500 })
  netSalary: number;

  @ApiProperty({
    description: 'Final salary after all adjustments',
    example: 44500,
  })
  finalSalary: number; // Salary after deductions are subtracted
}

export class SalaryDeductionResponseDto {
  @ApiProperty({
    type: [DeductionCalculationDto],
    description: 'List of deductions calculations per employee',
  })
  calculations: DeductionCalculationDto[];

  @ApiProperty({ description: 'Summary of deductions for all employees' })
  summary: {
    totalEmployees: number;
    totalDeductions: number;
    totalNetSalary: number;
  };
}
