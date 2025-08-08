import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { RequestStatus, RequestPriority } from '@prisma/client';

export class HrActionDto {
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status must be a valid value' })
  status?: RequestStatus;

  @IsOptional()
  @IsString({ message: 'Response notes must be a string' })
  responseNotes?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Assigned to ID must be a number' })
  assignedTo?: number;

  @IsOptional()
  @IsString({ message: 'Request type must be a string' })
  requestType?: string;

  @IsOptional()
  @IsString({ message: 'Subject must be a string' })
  subject?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsEnum(RequestPriority, { message: 'Priority must be a valid value' })
  priority?: RequestPriority;

  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;
}
