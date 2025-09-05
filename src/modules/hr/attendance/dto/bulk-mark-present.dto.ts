import { IsDateString, IsOptional, IsString } from 'class-validator';

export class BulkMarkPresentDto {
  @IsDateString()
  date: string; // Format: YYYY-MM-DD

  @IsOptional()
  @IsString()
  reason?: string; // Optional reason for marking all present (e.g., "Company event", "Holiday compensation")
}
