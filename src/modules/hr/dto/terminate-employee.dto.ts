import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';

export class TerminateEmployeeDto {
  @IsInt()
  employee_id: number;

  @IsString()
  @IsDateString()
  termination_date: string; // ISO string YYYY-MM-DD

  @IsOptional()
  @IsString()
  description?: string; // Optional description for the termination
}
