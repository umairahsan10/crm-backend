import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsPositive } from 'class-validator';
import { DifficultyLevel } from './update-project-details.dto';

export class CreateCompanyProjectDto {
  @IsString()
  description: string; // Required for company projects

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficultyLevel?: DifficultyLevel;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitHeadId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  teamId?: number;
}

