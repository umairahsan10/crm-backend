import { IsOptional, IsString, IsBoolean, IsInt, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// Query parameters for listing industries
export class GetIndustriesDto {
  // Search by name
  @IsOptional()
  @IsString()
  search?: string;

  // Filter by active status
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  // Sorting
  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt', 'id'], {
    message: 'sortBy must be one of: name, createdAt, updatedAt, id'
  })
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be either asc or desc'
  })
  sortOrder?: 'asc' | 'desc' = 'asc';

  // Pagination
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number = 20;
}

// Response DTOs
export class IndustryResponseDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Statistics (optional, for detail view)
  clientsCount?: number;
  crackedLeadsCount?: number;
}

export class IndustryListResponseDto {
  industries: IndustryResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class IndustryStatsDto {
  totalIndustries: number;
  activeIndustries: number;
  inactiveIndustries: number;
  totalClients: number;
  totalCrackedLeads: number;
  topIndustries: {
    id: number;
    name: string;
    clientsCount: number;
    crackedLeadsCount: number;
  }[];
}

