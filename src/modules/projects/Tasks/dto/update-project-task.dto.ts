import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ProjectTaskPriority, ProjectTaskDifficulty } from '@prisma/client';

export class UpdateProjectTaskDto {
  @IsOptional()
  @IsString({ message: 'Task title must be a string' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Task description must be a string' })
  description?: string;

  @IsOptional()
  @IsEnum(ProjectTaskPriority, { message: 'Invalid priority value' })
  priority?: ProjectTaskPriority;

  @IsOptional()
  @IsEnum(ProjectTaskDifficulty, { message: 'Invalid difficulty value' })
  difficulty?: ProjectTaskDifficulty;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date string' })
  dueDate?: string;

  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}
