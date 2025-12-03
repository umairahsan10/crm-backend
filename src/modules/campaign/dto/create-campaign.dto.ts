import {
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({
    example: 'Summer Launch 2025',
    description: 'Name of the campaign',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Campaign name must be a string' })
  @MinLength(2, { message: 'Campaign name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Campaign name must not exceed 255 characters' })
  campaignName: string;

  @ApiProperty({
    example: 'Digital',
    description: 'Type of campaign (e.g., Digital, Print, Outdoor)',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Campaign type must be a string' })
  @MinLength(2, { message: 'Campaign type must be at least 2 characters long' })
  @MaxLength(255, { message: 'Campaign type must not exceed 255 characters' })
  campaignType: string;

  @ApiProperty({
    example: '2025-05-01',
    description: 'Start date of the campaign (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate: string;

  @ApiProperty({
    example: '2025-08-31',
    description: 'End date of the campaign (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate: string;

  @ApiProperty({
    enum: CampaignStatus,
    example: CampaignStatus.Planned,
    description: 'Status of the campaign',
  })
  @IsEnum(CampaignStatus, { message: 'Status must be a valid campaign status' })
  status: CampaignStatus;

  @ApiProperty({
    example: 50000,
    description: 'Planned budget for the campaign',
  })
  @IsNumber({}, { message: 'Budget must be a number' })
  @IsPositive({ message: 'Budget must be a positive number' })
  budget: number;

  @ApiPropertyOptional({
    example: 42000,
    description: 'Actual cost of the campaign (if known)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Actual cost must be a number' })
  @IsPositive({ message: 'Actual cost must be a positive number' })
  actualCost?: number;

  @ApiProperty({
    example: 3,
    description: 'ID of the marketing unit associated with this campaign',
  })
  @IsNumber({}, { message: 'Unit ID must be a number' })
  @IsPositive({ message: 'Unit ID must be a positive number' })
  unitId: number;

  @ApiPropertyOptional({
    example:
      'This campaign focuses on promoting new product launches across social media.',
    description: 'Optional description of the campaign',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    example: 7,
    description:
      'Optional ID of the production unit associated with the campaign',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Production unit ID must be a number' })
  @IsPositive({ message: 'Production unit ID must be a positive number' })
  productionUnitId?: number;
}
