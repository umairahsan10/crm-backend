import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus, ComplaintPriority } from '@prisma/client';

export class ComplaintHrActionDto {
  @ApiPropertyOptional({
    enum: ComplaintStatus,
    description: 'Status of the complaint (e.g., OPEN, IN_PROGRESS, RESOLVED)',
  })
  @IsOptional()
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid value' })
  status?: ComplaintStatus;

  @ApiPropertyOptional({
    example: 'Issue has been resolved after HR review',
    description: 'Notes or remarks from HR regarding the resolution',
  })
  @IsOptional()
  @IsString({ message: 'Resolution notes must be a string' })
  resolutionNotes?: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Employee ID assigned to handle this complaint',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Assigned to employee ID must be a number' })
  assignedTo?: number;

  @ApiPropertyOptional({
    enum: ComplaintPriority,
    description: 'Priority level of the complaint (e.g., LOW, MEDIUM, HIGH)',
  })
  @IsOptional()
  @IsEnum(ComplaintPriority, { message: 'Priority must be a valid value' })
  priority?: ComplaintPriority;

  @ApiPropertyOptional({
    example: 'Workplace Behavior',
    description: 'Category or type of the complaint',
  })
  @IsOptional()
  @IsString({ message: 'Complaint type must be a string' })
  complaintType?: string;

  @ApiPropertyOptional({
    example: 'Unprofessional conduct',
    description: 'Subject line or short summary of the complaint',
  })
  @IsOptional()
  @IsString({ message: 'Subject must be a string' })
  subject?: string;

  @ApiPropertyOptional({
    example: 'Details regarding the issue...',
    description: 'Detailed description of the complaint or HR notes',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID of the department associated with the complaint',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Department ID must be a number' })
  departmentId?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Employee ID against whom the complaint is filed',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Against employee ID must be a number' })
  againstEmployeeId?: number;
}
