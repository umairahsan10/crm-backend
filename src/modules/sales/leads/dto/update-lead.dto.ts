import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { LeadOutcome, LeadStatus, LeadType } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadOutcome)
  outcome?: LeadOutcome;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadType)
  type?: LeadType;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  action?: 'push';

  // Fields for cracked lead creation (when outcome = "interested")
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  commission?: number;

  @IsOptional()
  @IsNumber()
  industryId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  totalPhases?: number;

  @IsOptional()
  @IsNumber()
  currentPhase?: number;
}
