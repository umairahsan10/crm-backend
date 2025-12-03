import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { RequestPriority, RequestStatus } from '@prisma/client';

export class CreateHrRequestDto {
  @ApiProperty({
    description: 'ID of the employee creating the HR request',
    example: 101,
  })
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsNumber({}, { message: 'Employee ID must be a number' })
  empId: number;

  @ApiPropertyOptional({
    description: 'Department ID associated with the HR request',
    example: 3,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;

  @ApiProperty({
    description: 'Type of HR request (e.g., Leave, Payroll, etc.)',
    example: 'Leave Request',
  })
  @IsNotEmpty({ message: 'Request type is required' })
  @IsString({ message: 'Request type must be a string' })
  requestType: string;

  @ApiProperty({
    description: 'Subject or short title of the HR request',
    example: 'Annual Leave Application',
  })
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject must be a string' })
  subject: string;

  @ApiProperty({
    description: 'Detailed description of the HR request',
    example: 'Requesting 10 days of annual leave starting from June 15.',
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiPropertyOptional({
    description: 'Priority level of the HR request',
    enum: RequestPriority,
    example: RequestPriority.High,
  })
  @IsOptional()
  @IsEnum(RequestPriority, { message: 'Priority must be a valid value' })
  priority?: RequestPriority;

  @ApiPropertyOptional({
    description: 'Current status of the HR request',
    enum: RequestStatus,
    example: RequestStatus.Pending,
  })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status must be a valid value' })
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Employee ID to whom the request is assigned for resolution',
    example: 205,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Assigned to ID must be a number' })
  assignedTo?: number;
}
