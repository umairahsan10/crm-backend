import { IsOptional, IsString } from 'class-validator';

export class UpdateProjectLogDto {
  @IsOptional()
  @IsString({ message: 'Log entry must be a string' })
  logEntry?: string;

  @IsOptional()
  @IsString({ message: 'Log type must be a string' })
  logType?: string;

  @IsOptional()
  @IsString({ message: 'Additional notes must be a string' })
  additionalNotes?: string;
}
