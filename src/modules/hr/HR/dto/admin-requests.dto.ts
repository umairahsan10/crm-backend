import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestType, AdminRequestStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export { RequestType, AdminRequestStatus };

export class CreateAdminRequestDto {
  @ApiProperty({ description: 'Description of the admin request' })
  @IsString()
  description: string;

  @ApiProperty({ enum: RequestType, description: 'Type of admin request' })
  @IsEnum(RequestType)
  type: RequestType;

  @ApiPropertyOptional({ description: 'Optional related HR log ID' })
  @IsOptional()
  @IsInt()
  hrLogId?: number;
}

export class UpdateAdminRequestDto {
  @ApiPropertyOptional({ description: 'Updated description of the request' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RequestType, description: 'Updated request type' })
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;
}

export class UpdateAdminRequestStatusDto {
  @ApiProperty({ enum: AdminRequestStatus, description: 'New status of the admin request' })
  @IsEnum(AdminRequestStatus)
  status: AdminRequestStatus;
}

export class AdminRequestResponseDto {
  @ApiProperty({ description: 'Admin request ID' })
  id: number;
  @ApiPropertyOptional({ description: 'Related HR ID' })
  hrId: number | null;

  @ApiPropertyOptional({ description: 'Related HR log ID' })
  hrLogId: number | null;

  @ApiPropertyOptional({ description: 'Description of the admin request' })
  description: string | null;

  @ApiPropertyOptional({ enum: RequestType, description: 'Type of admin request' })
  type: RequestType | null;

  @ApiPropertyOptional({ enum: AdminRequestStatus, description: 'Current status of the request' })
  status: AdminRequestStatus | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Related HR log details',
    example: {
      id: 1,
      employeeId: 2
    }
  })
  hrLog: {
    id: number;
    hrId: number;
    actionType: string | null;
    affectedEmployeeId: number | null;
    description: string | null;
    createdAt: Date;
  } | null;
}

export class PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Page number (1-based)', 
    minimum: 1, 
    default: 1,
    example: 1 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    minimum: 1, 
    maximum: 100, 
    default: 10,
    example: 10 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter requests from this date (ISO format)', 
    example: '2025-10-01' 
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter requests to this date (ISO format)', 
    example: '2025-10-31' 
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ 
    enum: AdminRequestStatus,
    description: 'Filter requests by status', 
    example: 'pending' 
  })
  @IsOptional()
  @IsEnum(AdminRequestStatus)
  status?: AdminRequestStatus;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

export class AdminRequestListResponseDto {
  @ApiProperty({ type: [AdminRequestResponseDto], description: 'List of admin requests' })
  adminRequests: AdminRequestResponseDto[];

  @ApiProperty({ description: 'Total number of admin requests' })
  total: number;

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}