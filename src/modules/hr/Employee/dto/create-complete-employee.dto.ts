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

// Employee Base DTO
export class EmployeeDataDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(['male', 'female', 'others'])
  gender: 'male' | 'female' | 'others';

  @IsOptional()
  @IsString()
  cnic?: string;

  @IsInt()
  departmentId: number;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsInt()
  managerId?: number;

  @IsOptional()
  @IsInt()
  teamLeadId?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  maritalStatus?: boolean;

  @IsOptional()
  @IsEnum(['active', 'terminated', 'inactive'])
  status?: 'active' | 'terminated' | 'inactive';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['hybrid', 'on_site', 'remote'])
  modeOfWork?: 'hybrid' | 'on_site' | 'remote';

  @IsOptional()
  @IsInt()
  remoteDaysAllowed?: number;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  shiftStart?: string;

  @IsOptional()
  @IsString()
  shiftEnd?: string;

  @IsOptional()
  @IsEnum(['full_time', 'part_time'])
  employmentType?: 'full_time' | 'part_time';

  @IsOptional()
  @IsDateString()
  dateOfConfirmation?: string;

  @IsOptional()
  @IsEnum(['probation', 'permanent', 'notice'])
  periodType?: 'probation' | 'permanent' | 'notice';

  @IsString()
  passwordHash: string;

  @IsOptional()
  @IsNumber()
  bonus?: number;
}

// HR Department Data DTO
export class HrDataDto {
  @IsOptional()
  @IsBoolean()
  attendancePermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  commissionPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  employeeAddPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  terminationsHandle?: boolean;

  @IsOptional()
  @IsBoolean()
  monthlyRequestApprovals?: boolean;

  @IsOptional()
  @IsBoolean()
  targetsSet?: boolean;

  @IsOptional()
  @IsBoolean()
  bonusesSet?: boolean;

  @IsOptional()
  @IsBoolean()
  shiftTimingSet?: boolean;
}

// Sales Department Data DTO
export class SalesDataDto {
  @IsOptional()
  @IsNumber()
  leadsClosed?: number;

  @IsOptional()
  @IsNumber()
  salesAmount?: number;

  @IsOptional()
  @IsInt()
  salesUnitId?: number;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  commissionAmount?: number;

  @IsOptional()
  @IsNumber()
  salesBonus?: number;

  @IsNumber()
  withholdCommission: number;

  @IsBoolean()
  withholdFlag: boolean;

  @IsOptional()
  @IsNumber()
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  chargebackDeductions?: number;

  @IsOptional()
  @IsNumber()
  refundDeductions?: number;
}

// Marketing Department Data DTO
export class MarketingDataDto {
  @IsOptional()
  @IsInt()
  marketingUnitId?: number;

  @IsOptional()
  @IsNumber()
  totalCampaignsRun?: number;

  @IsOptional()
  @IsString()
  platformFocus?: string;
}

// Production Department Data DTO
export class ProductionDataDto {
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsInt()
  productionUnitId?: number;

  @IsOptional()
  @IsNumber()
  projectsCompleted?: number;
}

// Accountant Data DTO
export class AccountantDataDto {
  @IsOptional()
  @IsBoolean()
  liabilitiesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  invoicesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  expensesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  assetsPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  revenuesPermission?: boolean;
}

// Bank Account Data DTO
export class BankAccountDataDto {
  @IsOptional()
  @IsString()
  accountTitle?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  ibanNumber?: string;

  @IsOptional()
  @IsNumber()
  baseSalary?: number;
}

// Department Data Container
export class DepartmentDataDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HrDataDto)
  hr?: HrDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalesDataDto)
  sales?: SalesDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MarketingDataDto)
  marketing?: MarketingDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductionDataDto)
  production?: ProductionDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccountantDataDto)
  accountant?: AccountantDataDto;
}

// Main Complete Employee DTO
export class CreateCompleteEmployeeDto {
  @ValidateNested()
  @Type(() => EmployeeDataDto)
  employee: EmployeeDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DepartmentDataDto)
  @IsObject()
  departmentData?: DepartmentDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDataDto)
  bankAccount?: BankAccountDataDto;
}

