import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectTaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(ProjectTaskStatus, { message: 'Invalid status value' })
  status: ProjectTaskStatus;

  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}
