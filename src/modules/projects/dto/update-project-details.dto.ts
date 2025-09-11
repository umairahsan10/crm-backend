import { IsOptional, IsString, IsEnum, IsNumber, IsDateString, Min, Max } from 'class-validator';

export enum DifficultyLevel {
  VERY_EASY = 'very_easy',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  DIFFICULT = 'difficult'
}

export enum PaymentStage {
  INITIAL = 'initial',
  IN_BETWEEN = 'in_between',
  FINAL = 'final',
  APPROVED = 'approved'
}

export enum ProjectStatus {
  IN_PROGRESS = 'in_progress',
  ONHOLD = 'onhold',
  COMPLETED = 'completed'
}

export class UpdateProjectDetailsDto {
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
}
