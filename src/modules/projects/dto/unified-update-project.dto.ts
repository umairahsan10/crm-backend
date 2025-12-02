import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import {
  DifficultyLevel,
  PaymentStage,
  ProjectStatus,
} from './update-project-details.dto';

export class UnifiedUpdateProjectDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsEnum(PaymentStage)
  paymentStage?: PaymentStage;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  liveProgress?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsInt()
  teamId?: number;
}
