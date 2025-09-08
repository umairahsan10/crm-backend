import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ComplaintStatus, ComplaintPriority } from '@prisma/client';

export class HrActionDto {
  @IsOptional()
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid value' })
  status?: ComplaintStatus;

  @IsOptional()
  @IsString({ message: 'Resolution notes must be a string' })
  resolutionNotes?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Assigned to employee ID must be a number' })
  assignedTo?: number;

  @IsOptional()
  @IsEnum(ComplaintPriority, { message: 'Priority must be a valid value' })
  priority?: ComplaintPriority;

  @IsOptional()
  @IsString({ message: 'Complaint type must be a string' })
  complaintType?: string;

  @IsOptional()
  @IsString({ message: 'Subject must be a string' })
  subject?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Against employee ID must be a number' })
  againstEmployeeId?: number;
}
