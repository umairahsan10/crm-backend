import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({
    example: 'Office Chair',
    description: 'Title or name of the asset',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Furniture',
    description: 'Category of the asset, e.g., Electronics, Furniture, Vehicle',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    example: '2025-01-10',
    description: 'Purchase date of the asset (ISO date string). Optional.',
  })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiProperty({
    example: 5000,
    description: 'Purchase value of the asset (must be positive)',
  })
  @IsNumber()
  @IsPositive()
  purchaseValue: number;

  @ApiProperty({
    example: 4000,
    description: 'Current value of the asset (must be positive)',
  })
  @IsNumber()
  @IsPositive()
  currentValue: number;

  @ApiProperty({
    example: 5,
    description: 'Vendor ID associated with the asset (must be positive)',
  })
  @IsNumber()
  @IsPositive()
  vendorId: number;
}
