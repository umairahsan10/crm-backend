import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { accStat } from '@prisma/client';

export class ClientQueryDto {
  @ApiPropertyOptional({
    description:
      'Search term to filter clients by name, email, or company name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Type of client (e.g., B2B, B2C)',
    example: 'B2B',
  })
  @IsOptional()
  @IsString()
  clientType?: string;

  @ApiPropertyOptional({
    description: 'Filter by company name',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Filter by client name',
    example: 'Jane Smith',
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({
    description: 'Filter by email address',
    example: 'jane.smith@acme.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by phone number',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Filter by city name',
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by state name',
    example: 'California',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by country name',
    example: 'United States',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter by industry ID',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  industryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    enum: accStat,
    example: accStat.active,
  })
  @IsOptional()
  @IsEnum(accStat)
  accountStatus?: accStat;

  @ApiPropertyOptional({
    description: 'Filter by the ID of the creator',
    example: 7,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  createdBy?: number;

  @ApiPropertyOptional({
    description: 'Filter clients created after this date (ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter clients created before this date (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Column to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (ascending or descending)',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number for pagination (defaults to 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (defaults to 10, max 100)',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
