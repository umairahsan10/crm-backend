import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class UpdateCrackedLeadDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  totalPhases?: number;

  @IsOptional()
  @IsNumber()
  currentPhase?: number;
}
