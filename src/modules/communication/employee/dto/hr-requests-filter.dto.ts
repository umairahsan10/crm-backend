import { IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RequestPriority, RequestStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class HrRequestsFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: RequestStatus,
    example: 'Pending'
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Filter by request priority',
    enum: RequestPriority,
    example: 'Critical'
  })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({
    description: 'Filter by request type',
    example: 'Leave Request'
  })
  @IsOptional()
  requestType?: string;

  @ApiPropertyOptional({
    description: 'Filter requests from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter requests to this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for subject or description',
    example: 'leave'
  })
  @IsOptional()
  search?: string;
}
