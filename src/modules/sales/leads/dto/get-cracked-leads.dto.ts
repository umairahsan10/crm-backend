import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { LeadStatus, LeadOutcome } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCrackedLeadsDto {
  @ApiPropertyOptional({
    description: 'Search term to filter leads by name, email, or phone',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Field to sort by', type: String })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by lead status',
    enum: LeadStatus,
  })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'Filter by lead outcome',
    enum: LeadOutcome,
  })
  @IsOptional()
  @IsEnum(LeadOutcome)
  outcome?: LeadOutcome;

  @ApiPropertyOptional({ description: 'Filter by sales unit ID', type: Number })
  @IsOptional()
  @IsNumber()
  salesUnitId?: number;

  @ApiPropertyOptional({
    description: 'Filter by assigned employee ID',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  assignedTo?: number;

  @ApiPropertyOptional({ description: 'Filter by industry ID', type: Number })
  @IsOptional()
  @IsNumber()
  industryId?: number;

  @ApiPropertyOptional({ description: 'Minimum deal amount', type: Number })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum deal amount', type: Number })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter by employee who closed the lead',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  closedBy?: number;

  @ApiPropertyOptional({
    description: 'Current phase number of the lead',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  currentPhase?: number;

  @ApiPropertyOptional({
    description: 'Total number of phases for the lead',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  totalPhases?: number;
}
