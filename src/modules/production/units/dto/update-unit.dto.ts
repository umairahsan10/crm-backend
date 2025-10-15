import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional, ValidateIf } from 'class-validator';

export class UpdateUnitDto {
  @ApiPropertyOptional({ description: 'Updated name of the unit', example: 'Sales' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated employee ID of the unit head', example: 5 })
  @IsOptional()
  @ValidateIf((o) => o.headId !== null && o.headId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;
} 