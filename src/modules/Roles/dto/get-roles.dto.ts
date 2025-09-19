import { IsOptional, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetRolesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}
