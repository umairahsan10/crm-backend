import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ description: 'Name of the department', example: 'Human Resources' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the department', example: 'Handles recruitment and employee relations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID of the manager assigned to the department', example: 3 })
  @IsOptional()
  @IsInt()
  managerId?: number;
}

