import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, DifficultyLevel } from './update-project-details.dto';

export class ProjectQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  teamId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  unitHeadId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  employeeId?: number;

  @IsOptional()
  @IsString()
  filterBy?: 'all' | 'team' | 'employee' | 'status';

  // Pagination fields
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'liveProgress' | 'status';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  // Include related data
  @IsOptional()
  @IsString()
  include?: string; // comma-separated: tasks,logs,payments,meetings,chat,teamMembers
}
