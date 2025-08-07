import { IsString, IsNumber, IsOptional, IsDateString, IsPositive } from 'class-validator';

export class CreateLiabilityDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsNumber()
  relatedVendorId?: number;
} 