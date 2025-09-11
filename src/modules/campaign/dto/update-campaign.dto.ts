import { IsString, IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, MinLength, MaxLength } from 'class-validator';
import { CampaignStatus } from '@prisma/client';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString({ message: 'Campaign name must be a string' })
  @MinLength(2, { message: 'Campaign name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Campaign name must not exceed 255 characters' })
  campaignName?: string;

  @IsOptional()
  @IsString({ message: 'Campaign type must be a string' })
  @MinLength(2, { message: 'Campaign type must be at least 2 characters long' })
  @MaxLength(255, { message: 'Campaign type must not exceed 255 characters' })
  campaignType?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate?: string;

  @IsOptional()
  @IsEnum(CampaignStatus, { message: 'Status must be a valid campaign status' })
  status?: CampaignStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Budget must be a number' })
  @IsPositive({ message: 'Budget must be a positive number' })
  budget?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Actual cost must be a number' })
  @IsPositive({ message: 'Actual cost must be a positive number' })
  actualCost?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Unit ID must be a number' })
  @IsPositive({ message: 'Unit ID must be a positive number' })
  unitId?: number;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Production unit ID must be a number' })
  @IsPositive({ message: 'Production unit ID must be a positive number' })
  productionUnitId?: number;
}
