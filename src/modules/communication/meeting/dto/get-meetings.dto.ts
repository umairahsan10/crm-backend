import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsDateString } from 'class-validator';
import { MeetingStatus } from '@prisma/client';

export class GetMeetingsDto {
  @ApiPropertyOptional({
    description: 'Filter meetings by employee ID',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  employeeId?: number;

  @ApiPropertyOptional({
    description: 'Filter meetings by client ID',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Filter meetings by project ID',
    example: 105,
  })
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @ApiPropertyOptional({
    description: 'Filter meetings by their status',
    enum: MeetingStatus,
    example: MeetingStatus.completed,
  })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @ApiPropertyOptional({
    description: 'Filter meetings that start after this date (ISO 8601 format)',
    example: '2025-10-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter meetings that end before this date (ISO 8601 format)',
    example: '2025-10-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Pagination: page number (defaults to 1 if omitted)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Pagination: number of results per page (defaults to 10 if omitted)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
