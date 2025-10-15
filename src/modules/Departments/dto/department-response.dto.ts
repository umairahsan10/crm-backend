import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentResponseDto {
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

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Manager details',
    example: {
      id: 5,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  })
  manager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  @ApiPropertyOptional({
    description: 'List of employees in the department',
    type: [Object],
    example: [
      { id: 6, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' },
      { id: 7, firstName: 'Bob', lastName: 'Brown', email: 'bob.brown@example.com' },
    ],
  })
  employees?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }[];
}

export class DepartmentsListResponseDto {
  @ApiProperty({ description: 'Array of departments', type: [DepartmentResponseDto] })
  departments: DepartmentResponseDto[];

  @ApiProperty({ description: 'Total number of departments', example: 10 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;
}
