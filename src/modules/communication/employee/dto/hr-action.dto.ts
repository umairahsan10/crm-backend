import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { RequestStatus, RequestPriority } from '@prisma/client';

export class EmployeeHrActionDto {
  @ApiPropertyOptional({
    description: 'Updated status of the HR request',
    enum: RequestStatus,
    example: RequestStatus.Resolved,
  })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status must be a valid value' })
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Notes or remarks provided by HR in response to the request',
    example: 'Request approved after review by HR manager.',
  })
  @IsOptional()
  @IsString({ message: 'Response notes must be a string' })
  responseNotes?: string;

  @ApiPropertyOptional({
    description: 'Employee ID to whom the request is reassigned or delegated',
    example: 203,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Assigned to ID must be a number' })
  assignedTo?: number;

  @ApiPropertyOptional({
    description: 'Type of HR request being updated',
    example: 'Leave Request',
  })
  @IsOptional()
  @IsString({ message: 'Request type must be a string' })
  requestType?: string;

  @ApiPropertyOptional({
    description: 'Subject or short title of the HR request',
    example: 'Annual Leave Adjustment',
  })
  @IsOptional()
  @IsString({ message: 'Subject must be a string' })
  subject?: string;

  @ApiPropertyOptional({
    description: 'Detailed description or context of the HR request',
    example: 'Employee requested adjustment in leave duration.',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the HR request',
    enum: RequestPriority,
    example: RequestPriority.Medium,
  })
  @IsOptional()
  @IsEnum(RequestPriority, { message: 'Priority must be a valid value' })
  priority?: RequestPriority;

  @ApiPropertyOptional({
    description: 'Department ID associated with this HR request',
    example: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;
}
