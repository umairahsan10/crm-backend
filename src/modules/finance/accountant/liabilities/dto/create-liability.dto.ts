import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLiabilityDto {
  @ApiProperty({
    example: 'Office Rent October',
    description: 'Name/title of the liability',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Rent', description: 'Category of the liability' })
  @IsString()
  category: string;

  @ApiProperty({ example: 25000, description: 'Amount of the liability' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: '2025-10-31',
    description: 'Due date of the liability in ISO format',
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Optional related vendor ID if applicable',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  relatedVendorId?: number;
}
