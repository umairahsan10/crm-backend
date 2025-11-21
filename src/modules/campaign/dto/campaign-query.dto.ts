import { 
  IsOptional, 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsDateString, 
  IsPositive 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';

export class CampaignQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword for campaign title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, description: 'Filter by campaign status' })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ description: 'Type of campaign (e.g. "digital", "print")' })
  @IsOptional()
  @IsString()
  campaignType?: string;

  @ApiPropertyOptional({ description: 'Filter by unit ID', example: 12 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  unitId?: number;

  @ApiPropertyOptional({ description: 'Filter by production unit ID', example: 5 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  productionUnitId?: number;

  @ApiPropertyOptional({ description: 'Start date lower bound (ISO format)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Start date upper bound (ISO format)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'End date lower bound (ISO format)', example: '2025-02-01' })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({ description: 'End date upper bound (ISO format)', example: '2025-11-30' })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @ApiPropertyOptional({ description: 'Minimum campaign budget', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  minBudget?: number;

  @ApiPropertyOptional({ description: 'Maximum campaign budget', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  maxBudget?: number;

  @ApiPropertyOptional({ description: 'Field to sort by (e.g. "startDate")' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], example: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  limit?: number;
}
