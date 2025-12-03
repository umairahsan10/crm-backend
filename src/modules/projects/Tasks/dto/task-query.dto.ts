import { IsOptional, IsEnum, IsNumber, IsString, IsIn } from 'class-validator';
import { ProjectTaskStatus, ProjectTaskPriority } from '@prisma/client';

export class TaskQueryDto {
  @IsOptional()
  @IsEnum(ProjectTaskStatus, { message: 'Invalid status value' })
  status?: ProjectTaskStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Assigned to must be a number' })
  assignedTo?: number;

  @IsOptional()
  @IsEnum(ProjectTaskPriority, { message: 'Invalid priority value' })
  priority?: ProjectTaskPriority;

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @IsIn(['dueDate', 'priority', 'createdAt'], {
    message: 'Sort by must be one of: dueDate, priority, createdAt',
  })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: 'Order must be a string' })
  @IsIn(['asc', 'desc'], { message: 'Order must be asc or desc' })
  order?: 'asc' | 'desc';
}
