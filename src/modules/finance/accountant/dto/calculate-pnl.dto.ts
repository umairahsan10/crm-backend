import { IsOptional, IsString, IsIn } from 'class-validator';

export class CalculatePnLDto {
  @IsOptional()
  @IsString()
  @IsIn(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
  month?: string;

  @IsOptional()
  @IsString()
  year?: string;
} 