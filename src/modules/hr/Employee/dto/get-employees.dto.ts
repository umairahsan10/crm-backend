import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetEmployeesDto {
  @ApiPropertyOptional({ description: 'Filter by department ID', example: 3 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Filter by role ID', example: 2 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({
    description: 'Filter by employee status',
    enum: ['active', 'terminated', 'inactive'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'terminated', 'inactive'])
  status?: 'active' | 'terminated' | 'inactive';

  @ApiPropertyOptional({
    description: 'Filter by gender',
    enum: ['male', 'female'],
    example: 'male',
  })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiPropertyOptional({
    description: 'Filter by employment type',
    enum: ['full_time', 'part_time'],
    example: 'full_time',
  })
  @IsOptional()
  @IsEnum(['full_time', 'part_time'])
  employmentType?: 'full_time' | 'part_time';

  @ApiPropertyOptional({
    description: 'Filter by mode of work',
    enum: ['hybrid', 'on_site', 'remote'],
    example: 'remote',
  })
  @IsOptional()
  @IsEnum(['hybrid', 'on_site', 'remote'])
  modeOfWork?: 'hybrid' | 'on_site' | 'remote';

  @ApiPropertyOptional({
    description: 'Search employees by name, email, or CNIC',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  limit?: number = 10;
}
