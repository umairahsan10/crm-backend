import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShiftDto {
  @ApiPropertyOptional({
    description: 'Shift start time in HH:MM 24-hour format',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'shift_start must be in HH:MM format (24-hour)',
  })
  shift_start?: string;

  @ApiPropertyOptional({
    description: 'Shift end time in HH:MM 24-hour format',
    example: '17:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'shift_end must be in HH:MM format (24-hour)',
  })
  shift_end?: string;
}