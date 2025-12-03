import { IsOptional, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDepartmentsDto {
  @ApiPropertyOptional({
    description: 'Filter departments by manager ID',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  managerId?: number;

  @ApiPropertyOptional({
    description: 'Search departments by name',
    example: 'Human',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}
