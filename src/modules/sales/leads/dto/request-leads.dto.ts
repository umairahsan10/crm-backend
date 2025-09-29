import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class RequestLeadsDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  keptLeadIds?: number[];

  @IsOptional()
  @IsBoolean()
  includePushLeads?: boolean;
}
