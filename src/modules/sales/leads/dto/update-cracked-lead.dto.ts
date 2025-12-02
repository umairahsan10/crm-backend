import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCrackedLeadDto {
  @ApiPropertyOptional({
    description: 'Description or notes for the cracked lead',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Monetary amount associated with the lead',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Commission rate for the lead in percentage',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({
    description: 'Total number of phases for the lead',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  totalPhases?: number;

  @ApiPropertyOptional({
    description: 'Current phase of the lead',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  currentPhase?: number;
}
