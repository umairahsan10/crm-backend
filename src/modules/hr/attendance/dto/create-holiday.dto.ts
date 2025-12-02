import {
  IsString,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({
    description: 'Name of the holiday',
    example: 'New Year Day',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  holidayName: string;

  @ApiProperty({
    description: 'Holiday date in YYYY-MM-DD format',
    example: '2023-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  holidayDate: string; // YYYY-MM-DD format

  @ApiPropertyOptional({
    description: 'Optional description of the holiday',
    example: 'Public holiday for New Year celebration',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
