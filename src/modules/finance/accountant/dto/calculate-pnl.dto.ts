import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CalculatePnLDto {
  @ApiPropertyOptional({
    description: 'Month for which to calculate PnL (format: MM)',
    example: '05',
    enum: ['01','02','03','04','05','06','07','08','09','10','11','12']
  })
  @IsOptional()
  @IsString()
  @IsIn(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
  month?: string;

  @ApiPropertyOptional({
    description: 'Year for which to calculate PnL (format: YYYY)',
    example: '2025'
  })
  @IsOptional()
  @IsString()
  year?: string;
} 