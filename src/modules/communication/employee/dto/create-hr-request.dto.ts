import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { RequestPriority, RequestStatus } from '@prisma/client';

export class CreateHrRequestDto {
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsNumber({}, { message: 'Employee ID must be a number' })
  empId: number;

  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;

  @IsNotEmpty({ message: 'Request type is required' })
  @IsString({ message: 'Request type must be a string' })
  requestType: string;

  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject must be a string' })
  subject: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsOptional()
  @IsEnum(RequestPriority, { message: 'Priority must be a valid value' })
  priority?: RequestPriority;

  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status must be a valid value' })
  status?: RequestStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Assigned to ID must be a number' })
  assignedTo?: number;
}
