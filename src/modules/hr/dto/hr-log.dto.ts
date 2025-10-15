import { IsOptional, IsNumber, IsString, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetHrLogsDto {
  @ApiPropertyOptional({ description: 'HR ID to filter logs', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hr_id?: number;

  @ApiPropertyOptional({ description: 'Action type of the log', type: String })
  @IsOptional()
  @IsString()
  action_type?: string;

  @ApiPropertyOptional({ description: 'Affected employee ID', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  affected_employee_id?: number;

  @ApiPropertyOptional({ description: 'Filter logs from this start date', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Filter logs until this end date', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Created at start date filter', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  created_start?: string;

  @ApiPropertyOptional({ description: 'Created at end date filter', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  created_end?: string;

  @ApiPropertyOptional({ description: 'Updated at start date filter', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  updated_start?: string;

  @ApiPropertyOptional({ description: 'Updated at end date filter', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  updated_end?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of logs per page', type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Field to order by', enum: ['id', 'createdAt', 'updatedAt', 'actionType', 'affectedEmployeeId'] })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'createdAt', 'updatedAt', 'actionType', 'affectedEmployeeId'])
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Order direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  orderDirection?: string;
}

export class HrLogResponseDto {
  @ApiPropertyOptional({ description: 'Log ID' })
  id: number;

  @ApiPropertyOptional({ description: 'HR ID who performed the action' })
  hrId: number;

  @ApiPropertyOptional({ description: 'Type of action', nullable: true })
  actionType: string | null;

  @ApiPropertyOptional({ description: 'Affected employee ID', nullable: true })
  affectedEmployeeId: number | null;

  @ApiPropertyOptional({ description: 'Description of the action', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Created timestamp' })
  createdAt: string;

  @ApiPropertyOptional({ description: 'Updated timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Affected employee details', type: Object, nullable: true })
  affectedEmployee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  @ApiPropertyOptional({ description: 'HR user details' })
  hr: {
    id: number;
    employee: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export class HrLogsListResponseDto {
  @ApiPropertyOptional({ type: [HrLogResponseDto], description: 'List of HR logs' })
  logs: HrLogResponseDto[];

  @ApiPropertyOptional({ description: 'Total number of logs' })
  total: number;

  @ApiPropertyOptional({ description: 'Current page number' })
  page: number;

  @ApiPropertyOptional({ description: 'Number of logs per page' })
  limit: number;

  @ApiPropertyOptional({ description: 'Total pages available' })
  totalPages: number;
}

export class ExportHrLogsDto extends GetHrLogsDto {
  @ApiPropertyOptional({ description: 'Export format', enum: ['csv', 'json'] })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string;
}