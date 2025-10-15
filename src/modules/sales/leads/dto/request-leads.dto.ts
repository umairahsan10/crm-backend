import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestLeadsDto {
  @ApiPropertyOptional({ description: 'Array of lead IDs to be kept', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  keptLeadIds?: number[];

  @ApiPropertyOptional({ description: 'Flag to include push leads', type: Boolean })
  @IsOptional()
  @IsBoolean()
  includePushLeads?: boolean;
}
