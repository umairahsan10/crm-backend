import { IsString, IsEmail, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
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