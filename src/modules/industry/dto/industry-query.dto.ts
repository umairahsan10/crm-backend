import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Query parameters for listing industries
export class GetIndustriesDto {
  // Search by name
  @ApiPropertyOptional({
    description: 'Search by industry name',
    example: 'Software',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Filter by active status
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  // Sorting
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'name',
    enum: ['name', 'createdAt', 'updatedAt', 'id'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt', 'id'], {
    message: 'sortBy must be one of: name, createdAt, updatedAt, id',
  })
  sortBy?: string = 'name';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be either asc or desc',
  })
  sortOrder?: 'asc' | 'desc' = 'asc';

  // Pagination
  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number = 20;
}

// Response DTOs
export class IndustryResponseDto {
  @ApiProperty({ description: 'Industry ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Industry name', example: 'Software' })
  name: string;

  @ApiPropertyOptional({
    description: 'Industry description',
    example: 'Software development companies',
  })
  description: string | null;

  @ApiProperty({ description: 'Whether the industry is active', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-14T04:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-14T04:00:00.000Z',
  })
  updatedAt: Date;

  // Statistics (optional, for detail view)
  @ApiPropertyOptional({
    description: 'Number of clients in this industry',
    example: 12,
  })
  clientsCount?: number;

  @ApiPropertyOptional({ description: 'Number of cracked leads', example: 5 })
  crackedLeadsCount?: number;
}

export class IndustryListResponseDto {
  @ApiProperty({
    description: 'List of industries',
    type: [IndustryResponseDto],
  })
  industries: IndustryResponseDto[];

  @ApiProperty({
    description: 'Pagination info',
    example: { page: 1, limit: 20, total: 50, totalPages: 3 },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class IndustryStatsDto {
  @ApiProperty({ description: 'Total number of industries', example: 50 })
  totalIndustries: number;

  @ApiProperty({ description: 'Number of active industries', example: 35 })
  activeIndustries: number;

  @ApiProperty({ description: 'Number of inactive industries', example: 15 })
  inactiveIndustries: number;

  @ApiProperty({ description: 'Total number of clients', example: 200 })
  totalClients: number;

  @ApiProperty({ description: 'Total number of cracked leads', example: 75 })
  totalCrackedLeads: number;

  @ApiProperty({
    description: 'Top industries with stats',
    example: [
      { id: 1, name: 'Software', clientsCount: 12, crackedLeadsCount: 5 },
      { id: 2, name: 'Retail', clientsCount: 8, crackedLeadsCount: 3 },
    ],
  })
  topIndustries: {
    id: number;
    name: string;
    clientsCount: number;
    crackedLeadsCount: number;
  }[];
}
