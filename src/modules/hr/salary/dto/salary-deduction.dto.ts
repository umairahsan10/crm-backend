import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';

export class SalaryDeductionDto {
  @IsOptional()
  @IsNumber()
  employeeId?: number;

  @IsOptional()
  @IsString()
  month?: string; // Format: YYYY-MM

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DeductionCalculationDto {
  employeeId: number;
  employeeName: string;
  baseSalary: number;
  perDaySalary: number;
  month: string;
  totalPresent: number;
  totalAbsent: number;
  totalLateDays: number;
  totalHalfDays: number;
  monthlyLatesDays: number;
  absentDeduction: number;
  lateDeduction: number;
  halfDayDeduction: number;
  chargebackDeduction: number;
  refundDeduction: number;
  totalDeduction: number;
  netSalary: number;
  finalSalary: number; // Salary after deductions are subtracted
}

export class SalaryDeductionResponseDto {
  calculations: DeductionCalculationDto[];
  summary: {
    totalEmployees: number;
    totalDeductions: number;
    totalNetSalary: number;
  };
} 