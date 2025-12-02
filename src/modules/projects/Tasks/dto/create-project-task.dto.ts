import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsIn,
} from 'class-validator';
import {
  ProjectTaskPriority,
  ProjectTaskStatus,
  ProjectTaskDifficulty,
} from '@prisma/client';

export class CreateProjectTaskDto {
  @IsNotEmpty({ message: 'Task title is required' })
  @IsString({ message: 'Task title must be a string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Task description must be a string' })
  description?: string;

  @IsNotEmpty({ message: 'Assigned to employee ID is required' })
  @IsNumber({}, { message: 'Assigned to employee ID must be a number' })
  assignedTo: number;

  @IsNotEmpty({ message: 'Priority is required' })
  @IsEnum(ProjectTaskPriority, { message: 'Invalid priority value' })
  priority: ProjectTaskPriority;

  @IsNotEmpty({ message: 'Difficulty is required' })
  @IsEnum(ProjectTaskDifficulty, { message: 'Invalid difficulty value' })
  difficulty: ProjectTaskDifficulty;

  @IsNotEmpty({ message: 'Due date is required' })
  @IsDateString({}, { message: 'Due date must be a valid date string' })
  dueDate: string;

  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}
