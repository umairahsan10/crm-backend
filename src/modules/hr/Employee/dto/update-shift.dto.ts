import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'shift_start must be in HH:MM format (24-hour)'
  })
  shift_start?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'shift_end must be in HH:MM format (24-hour)'
  })
  shift_end?: string;
} 