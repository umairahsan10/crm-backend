import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalaryDto {
  @ApiProperty({
    description: 'ID of the employee whose salary is being updated',
    example: 123,
  })
  @IsInt()
  employee_id: number;

  @ApiProperty({
    description: 'Updated salary amount',
    example: 60000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional description or reason for the salary update',
    example: 'Annual increment',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
