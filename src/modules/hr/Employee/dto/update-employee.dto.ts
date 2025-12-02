import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Employee first name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Employee last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Employee email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Employee phone number',
    example: '+923001234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Employee gender',
    enum: ['male', 'female', 'others'],
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'others'])
  gender?: 'male' | 'female' | 'others';

  @ApiPropertyOptional({
    description: 'Employee CNIC number',
    example: '12345-1234567-1',
  })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({
    description: 'Department ID of the employee',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Role ID of the employee', example: 5 })
  @IsOptional()
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({
    description: 'Manager ID of the employee',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @ApiPropertyOptional({
    description: 'Team lead ID of the employee',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  teamLeadId?: number;

  @ApiPropertyOptional({
    description: 'Employee address',
    example: '123 Main St, City',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Marital status of the employee',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  maritalStatus?: boolean;

  @ApiPropertyOptional({
    description: 'Employment status',
    enum: ['active', 'terminated', 'inactive'],
  })
  @IsOptional()
  @IsEnum(['active', 'terminated', 'inactive'])
  status?: 'active' | 'terminated' | 'inactive';

  @ApiPropertyOptional({
    description: 'Start date of employment',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date of employment',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Mode of work',
    enum: ['hybrid', 'on_site', 'remote'],
  })
  @IsOptional()
  @IsEnum(['hybrid', 'on_site', 'remote'])
  modeOfWork?: 'hybrid' | 'on_site' | 'remote';

  @ApiPropertyOptional({
    description: 'Number of remote days allowed',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  remoteDaysAllowed?: number;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact number',
    example: '+923001234567',
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Shift start time', example: '09:00' })
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @ApiPropertyOptional({ description: 'Shift end time', example: '17:00' })
  @IsOptional()
  @IsString()
  shiftEnd?: string;

  @ApiPropertyOptional({
    description: 'Employment type',
    enum: ['full_time', 'part_time'],
  })
  @IsOptional()
  @IsEnum(['full_time', 'part_time'])
  employmentType?: 'full_time' | 'part_time';

  @ApiPropertyOptional({
    description: 'Date of confirmation',
    example: '2025-04-01',
  })
  @IsOptional()
  @IsDateString()
  dateOfConfirmation?: string;

  @ApiPropertyOptional({
    description: 'Period type',
    enum: ['probation', 'permanent', 'notice'],
  })
  @IsOptional()
  @IsEnum(['probation', 'permanent', 'notice'])
  periodType?: 'probation' | 'permanent' | 'notice';

  @ApiPropertyOptional({
    description: 'Password hash',
    example: 'hashed_password_here',
  })
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @ApiPropertyOptional({ description: 'Bonus amount', example: 5000 })
  @IsOptional()
  @IsNumber()
  bonus?: number;
}
