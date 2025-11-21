import { IsString, IsEmail, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidRoleHierarchy } from '../../../../common/validators/role-hierarchy.validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'First name of the employee' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the employee' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Official email of the employee' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
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

  @ApiProperty({ description: 'Department ID where the employee works' })
  @IsInt()
  departmentId: number;

  @ApiProperty({ description: 'Role ID assigned to the employee' })
  @IsInt()
  roleId: number;

  @ApiPropertyOptional({ description: 'Manager ID (if applicable)' })
  @IsOptional()
  @IsInt()
  @IsValidRoleHierarchy({ message: 'Invalid role hierarchy: Manager assignment not allowed for this role' })
  managerId?: number;

  @ApiPropertyOptional({ description: 'Team Lead ID (if applicable)' })
  @IsOptional()
  @IsInt()
  @IsValidRoleHierarchy({ message: 'Invalid role hierarchy: Team Lead assignment not allowed for this role' })
  teamLeadId?: number;

  @ApiPropertyOptional({ description: 'Residential address of the employee' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Marital status (true = married, false = single)' })
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

  @ApiPropertyOptional({ enum: ['hybrid', 'on_site', 'remote'], description: 'Work mode type' })
  @IsOptional()
  @IsEnum(['hybrid', 'on_site', 'remote'])
  modeOfWork?: 'hybrid' | 'on_site' | 'remote';

  @ApiPropertyOptional({ description: 'Number of remote days allowed per month' })
  @IsOptional()
  @IsInt()
  remoteDaysAllowed?: number;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Shift start time (HH:mm format)' })
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @ApiPropertyOptional({ description: 'Shift end time (HH:mm format)' })
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

  @ApiPropertyOptional({ description: 'Bonus amount (if applicable)' })
  @IsOptional()
  @IsNumber()
  bonus?: number;
}