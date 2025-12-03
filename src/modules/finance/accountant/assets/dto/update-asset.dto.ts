import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAssetDto {
  @ApiProperty({
    example: 12,
    description: 'ID of the asset to update (must be positive)',
  })
  @IsNumber()
  @IsPositive()
  asset_id: number;

  @ApiPropertyOptional({
    example: 'Office Chair',
    description: 'Updated title or name of the asset (optional)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Furniture',
    description:
      'Updated category of the asset, e.g., Electronics, Furniture, Vehicle (optional)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: '2025-01-10',
    description:
      'Updated purchase date of the asset (ISO date string, optional)',
  })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({
    example: 5000,
    description:
      'Updated purchase value of the asset (must be positive, optional)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  purchaseValue?: number;

  @ApiPropertyOptional({
    example: 4000,
    description:
      'Updated current value of the asset (must be positive, optional)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  currentValue?: number;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Updated vendor ID associated with the asset (must be positive, optional)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;
}
