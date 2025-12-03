import { ApiProperty } from '@nestjs/swagger';

export class DepartmentCountDto {
  @ApiProperty({ description: 'Department name', example: 'Sales' })
  department: string;

  @ApiProperty({
    description: 'Number of employees in this department',
    example: 25,
  })
  count: number;
}

export class EmployeeCountByDepartmentResponseDto {
  @ApiProperty({
    description: 'Employee counts by department',
    type: [DepartmentCountDto],
  })
  departments: DepartmentCountDto[];

  @ApiProperty({
    description: 'Total number of employees across all departments',
    example: 120,
  })
  total: number;
}
