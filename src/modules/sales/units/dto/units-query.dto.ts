import { IsOptional, IsNumber, IsBoolean, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SalesUnitsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by specific unit ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitId?: number;

  @ApiPropertyOptional({ description: 'Filter units that have a head assigned', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasHead?: boolean;

  @ApiPropertyOptional({ description: 'Filter units that have teams assigned', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasTeams?: boolean;

  @ApiPropertyOptional({ description: 'Filter units that have leads assigned', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasLeads?: boolean;

  @ApiPropertyOptional({ description: 'Filter units that have employees assigned', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasEmployees?: boolean;

  @ApiPropertyOptional({ description: 'Include related data (employees,teams,leads)', example: 'employees,teams' })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'name' })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'email', 'createdAt', 'updatedAt', 'headId'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by unit name, email, or phone', example: 'sales' })
  @IsOptional()
  @IsString()
  search?: string;
}
