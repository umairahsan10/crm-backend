import { IsString, IsNumber, IsOptional, IsDateString, IsPositive } from 'class-validator';

export class UpdateLiabilityDto {
  @IsNumber()
  @IsPositive()
  liability_id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  relatedVendorId?: number;
} 