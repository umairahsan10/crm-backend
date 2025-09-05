import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ComplaintStatus, ComplaintPriority } from '@prisma/client';

export class CreateComplaintDto {
  @IsNotEmpty({ message: 'Raised by employee ID is required' })
  @IsNumber({}, { message: 'Raised by employee ID must be a number' })
  raisedBy: number;

  @IsOptional()
  @IsNumber({}, { message: 'Against employee ID must be a number' })
  againstEmployeeId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;

  @IsOptional()
  @IsString({ message: 'Complaint type must be a string' })
  complaintType?: string;

  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject must be a string' })
  subject: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsOptional()
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid value' })
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintPriority, { message: 'Priority must be a valid value' })
  priority?: ComplaintPriority;

  @IsOptional()
  @IsNumber({}, { message: 'Assigned to employee ID must be a number' })
  assignedTo?: number;
}
