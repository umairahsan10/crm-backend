import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsNumber, IsPositive } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty({ message: 'Unit name is required' })
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.headId !== null && o.headId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;
} 