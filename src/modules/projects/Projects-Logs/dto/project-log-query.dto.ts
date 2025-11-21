import { IsOptional, IsNumber, IsString, IsIn, IsDateString } from 'class-validator';

export class ProjectLogQueryDto {
  @IsOptional()
  @IsNumber({}, { message: 'Developer ID must be a number' })
  developerId?: number;

  @IsOptional()
  @IsString({ message: 'Log type must be a string' })
  logType?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  @IsIn(['createdAt', 'updatedAt'], { message: 'Sort by must be createdAt or updatedAt' })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: 'Order must be a string' })
  @IsIn(['asc', 'desc'], { message: 'Order must be asc or desc' })
  order?: 'asc' | 'desc';
}
