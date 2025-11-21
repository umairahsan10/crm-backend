import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SalesTeamsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Get specific team by ID', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teamId?: number;

  @ApiPropertyOptional({ 
    description: 'Get teams by sales unit ID', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salesUnitId?: number;

  @ApiPropertyOptional({ 
    description: 'Include related data (comma-separated: members,leads,unit,lead)', 
    example: 'members,leads' 
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
    description: 'Filter teams that have leads', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasLeads?: boolean;

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
    enum: ['name', 'createdAt', 'updatedAt', 'employeeCount', 'completedLeads'] 
  })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'updatedAt', 'employeeCount', 'completedLeads'])
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
    example: 'Sales' 
  })
  @IsOptional()
  @IsString()
  teamName?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by sales unit name', 
    example: 'North Region' 
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
    description: 'Minimum number of completed leads', 
    example: 5 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCompletedLeads?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum number of completed leads', 
    example: 50 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCompletedLeads?: number;

  @ApiPropertyOptional({ 
    description: 'Search by team name, lead name, or unit name (case-insensitive)', 
    example: 'sales team' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by assignment status (assigned/unassigned)', 
    example: true 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  assigned?: boolean;
}
