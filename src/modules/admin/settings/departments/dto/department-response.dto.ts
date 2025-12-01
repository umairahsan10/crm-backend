import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminDepartmentResponseDto {
  @ApiProperty({ description: 'Unique ID of the department', example: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the department', example: 'Human Resources' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the department', example: 'Handles HR operations' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Employee ID of the manager', example: 5 })
  managerId?: number | null;

  @ApiProperty({ description: 'Date when the department was created', example: '2025-10-14T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the department was last updated', example: '2025-10-14T12:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Email of the department manager', example: 'john.doe@example.com' })
  managerEmail?: string | null;

  @ApiProperty({ description: 'Total number of employees in the department', example: 15 })
  employeesCount: number;
}

export class AdminDepartmentsListResponseDto {
  @ApiProperty({ description: 'Array of departments', type: [AdminDepartmentResponseDto] })
  departments: AdminDepartmentResponseDto[];

  @ApiProperty({ description: 'Total number of departments', example: 10 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;
}

