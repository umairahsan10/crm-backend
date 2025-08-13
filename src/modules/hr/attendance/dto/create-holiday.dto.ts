import { IsString, IsDateString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  holidayName: string;

  @IsDateString()
  @IsNotEmpty()
  holidayDate: string; // YYYY-MM-DD format

  @IsString()
  @IsOptional()
  description?: string;
}
