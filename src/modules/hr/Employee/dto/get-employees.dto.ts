import { IsOptional, IsEnum, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetEmployeesDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsEnum(['active', 'terminated', 'inactive'])
  status?: 'active' | 'terminated' | 'inactive';

  @IsOptional()
  @IsEnum(['full_time', 'part_time'])
  employmentType?: 'full_time' | 'part_time';

  @IsOptional()
  @IsEnum(['hybrid', 'on_site', 'remote'])
  modeOfWork?: 'hybrid' | 'on_site' | 'remote';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  limit?: number = 10;
} 