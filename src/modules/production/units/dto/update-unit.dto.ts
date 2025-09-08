import { IsString, IsNumber, IsPositive, IsOptional, ValidateIf } from 'class-validator';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf((o) => o.headId !== null && o.headId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;
} 