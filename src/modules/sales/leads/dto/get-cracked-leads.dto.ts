import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { LeadStatus, LeadOutcome } from '@prisma/client';

export class GetCrackedLeadsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadOutcome)
  outcome?: LeadOutcome;

  @IsOptional()
  @IsNumber()
  salesUnitId?: number;

  @IsOptional()
  @IsNumber()
  assignedTo?: number;

  @IsOptional()
  @IsNumber()
  industryId?: number;

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  closedBy?: number;

  @IsOptional()
  @IsNumber()
  currentPhase?: number;

  @IsOptional()
  @IsNumber()
  totalPhases?: number;
}
