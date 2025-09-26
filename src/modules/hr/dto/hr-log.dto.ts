import { IsOptional, IsNumber, IsString, IsDateString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetHrLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hr_id?: number;

  @IsOptional()
  @IsString()
  action_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  affected_employee_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  created_start?: string;

  @IsOptional()
  @IsDateString()
  created_end?: string;

  @IsOptional()
  @IsDateString()
  updated_start?: string;

  @IsOptional()
  @IsDateString()
  updated_end?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['id', 'createdAt', 'updatedAt', 'actionType', 'affectedEmployeeId'])
  orderBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  orderDirection?: string;
}

export class HrLogResponseDto {
  id: number;
  hrId: number;
  actionType: string | null;
  affectedEmployeeId: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  affectedEmployee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
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
  logs: HrLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ExportHrLogsDto extends GetHrLogsDto {
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string;
}