import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMarketingDto {
  @IsNumber()
  employeeId: number;

  @IsOptional()
  @IsNumber()
  marketingUnitId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCampaignsRun?: number;

  @IsOptional()
  @IsString()
  platformFocus?: string;
}

export class UpdateMarketingDto {
  @IsOptional()
  @IsNumber()
  marketingUnitId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCampaignsRun?: number;

  @IsOptional()
  @IsString()
  platformFocus?: string;
} 