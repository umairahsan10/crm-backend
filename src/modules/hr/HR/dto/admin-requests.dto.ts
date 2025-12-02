import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
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

  @ApiPropertyOptional({
    enum: RequestType,
    description: 'Updated request type',
  })
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;
}

export class UpdateAdminRequestStatusDto {
  @ApiProperty({
    enum: AdminRequestStatus,
    description: 'New status of the admin request',
  })
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

  @ApiPropertyOptional({
    enum: RequestType,
    description: 'Type of admin request',
  })
  type: RequestType | null;

  @ApiPropertyOptional({
    enum: AdminRequestStatus,
    description: 'Current status of the request',
  })
  status: AdminRequestStatus | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'HR details who created the request',
    example: {
      id: 5,
      employeeId: 10,
      employee: {
        id: 10,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+1234567890',
        department: { id: 2, name: 'HR', description: 'Human Resources' },
        role: { id: 3, name: 'dep_manager', description: 'Department Manager' },
      },
    },
  })
  hr?: {
    id: number;
    employeeId: number;
    employee?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      department?: {
        id: number;
        name: string;
        description: string | null;
      };
      role?: {
        id: number;
        name: string;
        description: string | null;
      };
    };
  } | null;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Related HR log details with affected employee information',
    example: {
      id: 123,
      hrId: 5,
      actionType: 'HR_REQUEST_CREATE',
      affectedEmployeeId: 789,
      description: 'HR record created for employee John Doe',
      createdAt: '2024-01-15T10:25:00.000Z',
      affectedEmployee: {
        id: 789,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        status: 'active',
        department: { id: 1, name: 'Development' },
        role: { id: 2, name: 'senior' },
      },
    },
  })
  hrLog?: {
    id: number;
    hrId: number;
    actionType: string | null;
    affectedEmployeeId: number | null;
    description: string | null;
    createdAt: Date;
    affectedEmployee?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      status: string;
      department?: {
        id: number;
        name: string;
      };
      role?: {
        id: number;
        name: string;
      };
    } | null;
  } | null;
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    example: 1,
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
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter requests from this date (ISO format)',
    example: '2025-10-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter requests to this date (ISO format)',
    example: '2025-10-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    enum: AdminRequestStatus,
    description: 'Filter requests by status',
    example: 'pending',
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

export class LimitedAdminRequestResponseDto {
  @ApiProperty({ description: 'Admin request ID' })
  id: number;

  @ApiPropertyOptional({ description: 'Description of the admin request' })
  description: string | null;

  @ApiPropertyOptional({
    enum: RequestType,
    description: 'Type of admin request',
  })
  type: RequestType | null;

  @ApiPropertyOptional({
    enum: AdminRequestStatus,
    description: 'Current status of the request',
  })
  status: AdminRequestStatus | null;

  @ApiPropertyOptional({ description: 'Related HR ID' })
  hrId: number | null;

  @ApiPropertyOptional({
    description: 'First name of HR employee who created the request',
  })
  hrFirstName: string | null;

  @ApiPropertyOptional({
    description: 'Last name of HR employee who created the request',
  })
  hrLastName: string | null;

  @ApiPropertyOptional({
    description: 'Email of HR employee who created the request',
  })
  hrEmail: string | null;

  @ApiPropertyOptional({ description: 'Related HR log ID' })
  hrLogId: number | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;
}

export class AdminRequestListResponseDto {
  @ApiProperty({
    type: [LimitedAdminRequestResponseDto],
    description: 'List of admin requests',
  })
  adminRequests: LimitedAdminRequestResponseDto[];

  @ApiProperty({ description: 'Total number of admin requests' })
  total: number;

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}
