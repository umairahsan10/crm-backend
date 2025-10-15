import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsNumber, IsPositive } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ description: 'Name of the unit', example: 'Marketing' })
  @IsString()
  @IsNotEmpty({ message: 'Unit name is required' })
  name: string;

  @ApiPropertyOptional({ description: 'Employee ID of the unit head', example: 5 })
  @IsOptional()
  @ValidateIf((o) => o.headId !== null && o.headId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;
} 