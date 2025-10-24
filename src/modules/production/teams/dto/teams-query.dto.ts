import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class TeamsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Get specific team by ID', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teamId?: number;

  @ApiPropertyOptional({ 
    description: 'Get teams by production unit ID', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitId?: number;

  @ApiPropertyOptional({ 
    description: 'Include related data (comma-separated: members,projects,unit,lead)', 
    example: 'members,projects' 
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({ 
    description: 'Filter teams that have leads assigned', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasLead?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter teams that have members', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasMembers?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter teams that have projects', 
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
    enum: ['name', 'createdAt', 'updatedAt', 'employeeCount'] 
  })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'updatedAt', 'employeeCount'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'] 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by team lead email', 
    example: 'john.doe@company.com' 
  })
  @IsOptional()
  @IsString()
  leadEmail?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by team lead name (firstName or lastName)', 
    example: 'John' 
  })
  @IsOptional()
  @IsString()
  leadName?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by team name (partial match)', 
    example: 'Development' 
  })
  @IsOptional()
  @IsString()
  teamName?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by production unit name', 
    example: 'Unit A' 
  })
  @IsOptional()
  @IsString()
  unitName?: string;

  @ApiPropertyOptional({ 
    description: 'Minimum number of members', 
    example: 2 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minMembers?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum number of members', 
    example: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxMembers?: number;

  @ApiPropertyOptional({ 
    description: 'Minimum number of projects', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minProjects?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum number of projects', 
    example: 5 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxProjects?: number;
}
