import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Name of the department',
    example: 'Human Resources',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the department',
    example: 'Handles all HR-related activities and employee relations',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Employee ID of the department manager',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  managerId?: number;
}
