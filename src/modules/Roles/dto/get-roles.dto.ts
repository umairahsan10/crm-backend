import { IsOptional, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetRolesDto {
  @ApiPropertyOptional({
    description: 'Search string to filter roles by name or description',
    example: 'manager',
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
    description: 'Number of records per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}
