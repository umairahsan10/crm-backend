import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus, ComplaintPriority } from '@prisma/client';

export class CreateComplaintDto {
  @ApiProperty({ example: 12, description: 'ID of the employee who raised the complaint' })
  @IsNotEmpty({ message: 'Raised by employee ID is required' })
  @IsNumber({}, { message: 'Raised by employee ID must be a number' })
  raisedBy: number;

  @ApiPropertyOptional({ example: 45, description: 'ID of the employee against whom the complaint is made' })
  @IsOptional()
  @IsNumber({}, { message: 'Against employee ID must be a number' })
  againstEmployeeId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Department ID related to the complaint' })
  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;

  @ApiPropertyOptional({ example: 'Harassment', description: 'Type of complaint (e.g., Harassment, Misconduct, etc.)' })
  @IsOptional()
  @IsString({ message: 'Complaint type must be a string' })
  complaintType?: string;

  @ApiProperty({ example: 'Workplace misconduct', description: 'Short subject of the complaint' })
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject must be a string' })
  subject: string;

  @ApiProperty({ example: 'Details of the incident...', description: 'Detailed description of the complaint' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiPropertyOptional({ enum: ComplaintStatus, description: 'Current status of the complaint' })
  @IsOptional()
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid value' })
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ComplaintPriority, description: 'Priority level of the complaint' })
  @IsOptional()
  @IsEnum(ComplaintPriority, { message: 'Priority must be a valid value' })
  priority?: ComplaintPriority;

  @ApiPropertyOptional({ example: 8, description: 'Employee ID to whom the complaint is assigned for resolution' })
  @IsOptional()
  @IsNumber({}, { message: 'Assigned to employee ID must be a number' })
  assignedTo?: number;
}
