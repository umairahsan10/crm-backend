import { 
  IsString, 
  IsDateString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsPositive, 
  MinLength, 
  MaxLength 
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    example: 'Winter Sale 2025',
    description: 'Updated name of the campaign',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Campaign name must be a string' })
  @MinLength(2, { message: 'Campaign name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Campaign name must not exceed 255 characters' })
  campaignName?: string;

  @ApiPropertyOptional({
    example: 'Social Media',
    description: 'Updated campaign type (e.g., Digital, Print, Outdoor)',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Campaign type must be a string' })
  @MinLength(2, { message: 'Campaign type must be at least 2 characters long' })
  @MaxLength(255, { message: 'Campaign type must not exceed 255 characters' })
  campaignType?: string;

  @ApiPropertyOptional({
    example: '2025-06-01',
    description: 'Updated start date in ISO 8601 format',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-07-31',
    description: 'Updated end date in ISO 8601 format',
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate?: string;

  @ApiPropertyOptional({
    enum: CampaignStatus,
    example: CampaignStatus.Planned,
    description: 'Planned status of the campaign',
  })
  @IsOptional()
  @IsEnum(CampaignStatus, { message: 'Status must be a valid campaign status' })
  status?: CampaignStatus;

  @ApiPropertyOptional({
    example: 60000,
    description: 'Updated planned budget for the campaign',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Budget must be a number' })
  @IsPositive({ message: 'Budget must be a positive number' })
  budget?: number;

  @ApiPropertyOptional({
    example: 58000,
    description: 'Updated actual cost for the campaign (if available)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Actual cost must be a number' })
  @IsPositive({ message: 'Actual cost must be a positive number' })
  actualCost?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated ID of the marketing unit associated with the campaign',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Unit ID must be a number' })
  @IsPositive({ message: 'Unit ID must be a positive number' })
  unitId?: number;

  @ApiPropertyOptional({
    example: 'Extended campaign duration due to strong engagement.',
    description: 'Updated campaign description (optional)',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    example: 8,
    description: 'Updated ID of the production unit associated with the campaign',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Production unit ID must be a number' })
  @IsPositive({ message: 'Production unit ID must be a positive number' })
  productionUnitId?: number;
}
