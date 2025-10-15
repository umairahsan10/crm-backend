import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadOutcome, LeadStatus, LeadType } from '@prisma/client';

export class UpdateLeadDto {
  @ApiPropertyOptional({ description: 'Outcome of the lead', enum: LeadOutcome })
  @IsOptional()
  @IsEnum(LeadOutcome)
  outcome?: LeadOutcome;

  @ApiPropertyOptional({ description: 'Current status of the lead', enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Type of the lead', enum: LeadType })
  @IsOptional()
  @IsEnum(LeadType)
  type?: LeadType;

  @ApiPropertyOptional({ description: 'Comment about the lead', type: String })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Action to perform on the lead', type: String, example: 'push' })
  @IsOptional()
  @IsString()
  action?: 'push';

  // Fields for cracked lead creation (when outcome = "interested")
  @ApiPropertyOptional({ description: 'Total monetary amount for cracked lead', type: Number })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Industry ID associated with the lead', type: Number })
  @IsOptional()
  @IsNumber()
  industryId?: number;

  @ApiPropertyOptional({ description: 'Detailed description of the lead', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Total number of phases for the lead', type: Number })
  @IsOptional()
  @IsNumber()
  totalPhases?: number;

  @ApiPropertyOptional({ description: 'Current phase of the lead', type: Number })
  @IsOptional()
  @IsNumber()
  currentPhase?: number;
}
