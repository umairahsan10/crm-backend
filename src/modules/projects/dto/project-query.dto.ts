import { IsOptional, IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { ProjectStatus, DifficultyLevel } from './update-project-details.dto';

export class ProjectQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  teamId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitHeadId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  employeeId?: number;

  @IsOptional()
  @IsString()
  filterBy?: 'all' | 'team' | 'employee' | 'status';
}
