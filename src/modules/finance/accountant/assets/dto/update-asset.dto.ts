import { IsString, IsNumber, IsOptional, IsDateString, IsPositive } from 'class-validator';

export class UpdateAssetDto {
  @IsNumber()
  @IsPositive()
  asset_id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  purchaseValue?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  currentValue?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendorId?: number;
} 