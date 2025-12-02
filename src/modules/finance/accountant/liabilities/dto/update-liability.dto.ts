import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLiabilityDto {
  @ApiProperty({ example: 301, description: 'ID of the liability to update' })
  @IsNumber()
  @IsPositive()
  liability_id: number;

  @ApiPropertyOptional({
    example: 'Office Rent October',
    description: 'Updated name/title of the liability',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Rent',
    description: 'Updated category of the liability',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Updated amount of the liability',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    example: '2025-10-31',
    description: 'Updated due date of the liability in ISO format',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Updated related vendor ID, if applicable',
  })
  @IsOptional()
  @IsNumber()
  relatedVendorId?: number;
}
