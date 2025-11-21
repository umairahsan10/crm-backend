import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional, ValidateIf } from 'class-validator';

export class UpdateProductionUnitDto {
  @ApiPropertyOptional({ description: 'Updated name of the unit', example: 'Sales' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Employee ID of the unit head (required)', example: 5 })
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId: number;
} 