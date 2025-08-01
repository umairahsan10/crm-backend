import { IsInt, IsString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessLeaveActionDto {
  @IsEnum(['Approved', 'Rejected'])
  action: 'Approved' | 'Rejected';

  @Type(() => Number)
  @IsInt()
  reviewer_id: number;

  @IsOptional()
  @IsString()
  confirmation_reason?: string;
} 