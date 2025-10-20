import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UnitsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Get specific unit by ID', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitId?: number;

  @ApiPropertyOptional({ 
    description: 'Include related data (comma-separated: employees,projects,teams,head)', 
    example: 'employees,projects' 
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({ 
    description: 'Filter units that have heads assigned', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasHead?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter units that have teams assigned', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasTeams?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter units that have projects', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasProjects?: boolean;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    example: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'Sort by field', 
    enum: ['name', 'createdAt', 'updatedAt'] 
  })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'] 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;
}
