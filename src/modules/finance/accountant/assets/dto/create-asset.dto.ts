import { IsString, IsNumber, IsPositive, IsDateString, IsOptional } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsNumber()
  @IsPositive()
  purchaseValue: number;

  @IsNumber()
  @IsPositive()
  currentValue: number;

  @IsNumber()
  @IsPositive()
  vendorId: number;
} 