import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarketingDto {
  @ApiProperty({ description: 'ID of the employee', example: 123 })
  @IsNumber()
  employeeId: number;

  @ApiPropertyOptional({ description: 'ID of the marketing unit', example: 5 })
  @IsOptional()
  @IsNumber()
  marketingUnitId?: number;

  @ApiPropertyOptional({
    description: 'Total campaigns run by the employee',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCampaignsRun?: number;

  @ApiPropertyOptional({
    description: 'Primary platform focus of the marketing employee',
    example: 'Facebook Ads',
  })
  @IsOptional()
  @IsString()
  platformFocus?: string;
}

export class UpdateMarketingDto {
  @ApiPropertyOptional({ description: 'ID of the marketing unit', example: 5 })
  @IsOptional()
  @IsNumber()
  marketingUnitId?: number;

  @ApiPropertyOptional({
    description: 'Total campaigns run by the employee',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCampaignsRun?: number;

  @ApiPropertyOptional({
    description: 'Primary platform focus of the marketing employee',
    example: 'Facebook Ads',
  })
  @IsOptional()
  @IsString()
  platformFocus?: string;
}
