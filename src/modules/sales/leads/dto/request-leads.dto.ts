import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class RequestLeadsDto {
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  keptLeadIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  circulateLeadIds?: number[];
}
