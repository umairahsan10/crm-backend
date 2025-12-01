import { IsNumber, IsPositive, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { DifficultyLevel } from './update-project-details.dto';

export class AssignProjectTeamDto {
  @IsNumber()
  @IsPositive()
  teamId: number;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;
}
