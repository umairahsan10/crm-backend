import { IsNumber, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBonusDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  bonus: number;
} 