import {
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsInt, 
  IsBoolean, 
  IsDateString, 
  IsNumber,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Employee Base DTO
export class EmployeeDataDto {
  @ApiProperty({ description: 'First name of the employee' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the employee' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Official email of the employee' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Contact number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['male', 'female', 'others'], description: 'Gender of the employee' })
  @IsEnum(['male', 'female', 'others'])
  gender: 'male' | 'female' | 'others';

  @ApiPropertyOptional({ description: 'CNIC or national ID number' })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiProperty({ description: 'Department ID the employee belongs to' })
  @IsInt()
  departmentId: number;

  @ApiProperty({ description: 'Role ID assigned to the employee' })
  @IsInt()
  roleId: number;

  @ApiPropertyOptional({ description: 'Manager ID (if applicable)' })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @ApiPropertyOptional({ description: 'Team lead ID (if applicable)' })
  @IsOptional()
  @IsInt()
  teamLeadId?: number;

  @ApiPropertyOptional({ description: 'Residential address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Marital status flag' })
  @IsOptional()
  @IsBoolean()
  maritalStatus?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'terminated', 'inactive'], description: 'Employment status' })
  @IsOptional()
  @IsEnum(['active', 'terminated', 'inactive'])
  status?: 'active' | 'terminated' | 'inactive';

  @ApiPropertyOptional({ description: 'Employment start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Employment end date (if applicable)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['hybrid', 'on_site', 'remote'], description: 'Work mode' })
  @IsOptional()
  @IsEnum(['hybrid', 'on_site', 'remote'])
  modeOfWork?: 'hybrid' | 'on_site' | 'remote';

  @ApiPropertyOptional({ description: 'Number of remote work days allowed per month' })
  @IsOptional()
  @IsInt()
  remoteDaysAllowed?: number;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ description: 'Emergency contact details' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Shift start time (HH:mm)' })
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @ApiPropertyOptional({ description: 'Shift end time (HH:mm)' })
  @IsOptional()
  @IsString()
  shiftEnd?: string;

  @ApiPropertyOptional({ enum: ['full_time', 'part_time'], description: 'Type of employment' })
  @IsOptional()
  @IsEnum(['full_time', 'part_time'])
  employmentType?: 'full_time' | 'part_time';

  @ApiPropertyOptional({ description: 'Date of confirmation (if applicable)' })
  @IsOptional()
  @IsDateString()
  dateOfConfirmation?: string;

  @ApiPropertyOptional({ enum: ['probation', 'permanent', 'notice'], description: 'Employment period type' })
  @IsOptional()
  @IsEnum(['probation', 'permanent', 'notice'])
  periodType?: 'probation' | 'permanent' | 'notice';

  @ApiProperty({ description: 'Hashed password for authentication' })
  @IsString()
  passwordHash: string;

  @ApiPropertyOptional({ description: 'Bonus amount (if any)' })
  @IsOptional()
  @IsNumber()
  bonus?: number;
}

// HR Department DTO
export class HrDataDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() attendancePermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() salaryPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() commissionPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() employeeAddPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() terminationsHandle?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() monthlyRequestApprovals?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() targetsSet?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() bonusesSet?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() shiftTimingSet?: boolean;
}

//  Sales Department DTO
export class SalesDataDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() leadsClosed?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salesAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() salesUnitId?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() commissionRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() commissionAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salesBonus?: number;

  @ApiProperty({ description: 'Whether to withhold commission amount' })
  @IsNumber()
  withholdCommission: number;

  @ApiProperty()
  @IsBoolean()
  withholdFlag: boolean;

  @ApiPropertyOptional() @IsOptional() @IsNumber() targetAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() chargebackDeductions?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() refundDeductions?: number;
}

// Marketing Department DTO
export class MarketingDataDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() marketingUnitId?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalCampaignsRun?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() platformFocus?: string;
}

// Production Department DTO
export class ProductionDataDto {
  @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() productionUnitId?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() projectsCompleted?: number;
}

// Accountant Department DTO
export class AccountantDataDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() liabilitiesPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() salaryPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() salesPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() invoicesPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() expensesPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() assetsPermission?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() revenuesPermission?: boolean;
}

/** =======================
 *  Bank Account DTO
 *  ======================= */
export class BankAccountDataDto {
  @ApiPropertyOptional() @IsOptional() @IsString() accountTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ibanNumber?: string;
  @ApiPropertyOptional({ description: 'Base salary credited monthly' })
  @IsOptional()
  @IsNumber()
  baseSalary?: number;
}

// Department Data Container
export class DepartmentDataDto {
  @ApiPropertyOptional({ type: HrDataDto }) @IsOptional() @ValidateNested() @Type(() => HrDataDto) hr?: HrDataDto;
  @ApiPropertyOptional({ type: SalesDataDto }) @IsOptional() @ValidateNested() @Type(() => SalesDataDto) sales?: SalesDataDto;
  @ApiPropertyOptional({ type: MarketingDataDto }) @IsOptional() @ValidateNested() @Type(() => MarketingDataDto) marketing?: MarketingDataDto;
  @ApiPropertyOptional({ type: ProductionDataDto }) @IsOptional() @ValidateNested() @Type(() => ProductionDataDto) production?: ProductionDataDto;
  @ApiPropertyOptional({ type: AccountantDataDto }) @IsOptional() @ValidateNested() @Type(() => AccountantDataDto) accountant?: AccountantDataDto;
}

// Main Complete Employee DTO
export class CreateCompleteEmployeeDto {
  @ApiProperty({ type: EmployeeDataDto, description: 'Core employee information' })
  @ValidateNested()
  @Type(() => EmployeeDataDto)
  employee: EmployeeDataDto;

  @ApiPropertyOptional({ type: DepartmentDataDto, description: 'Department-specific data (based on role)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DepartmentDataDto)
  @IsObject()
  departmentData?: DepartmentDataDto;

  @ApiPropertyOptional({ type: BankAccountDataDto, description: 'Bank account information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDataDto)
  bankAccount?: BankAccountDataDto;
}
