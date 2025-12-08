import { IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttendanceDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsNumber()
  @Type(() => Number)
  employee_id: number;

  @ApiPropertyOptional({
    description: 'Number of present days',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  present_days?: number;

  @ApiPropertyOptional({
    description: 'Number of absent days',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  absent_days?: number;

  @ApiPropertyOptional({
    description: 'Number of late days',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  late_days?: number;

  @ApiPropertyOptional({
    description: 'Number of leave days',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  leave_days?: number;

  @ApiPropertyOptional({
    description: 'Number of remote work days',
    example: 8,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  remote_days?: number;

  @ApiPropertyOptional({
    description: 'Number of available leaves',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  available_leaves?: number;

  @ApiPropertyOptional({
    description: 'Number of monthly lates',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  monthly_lates?: number;

  @ApiPropertyOptional({
    description: 'Number of half days',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  half_days?: number;
}
