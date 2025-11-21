import { ApiProperty } from '@nestjs/swagger';

export class EmployeeStatisticsDto {
  @ApiProperty({ description: 'Total number of employees' })
  total: number;

  @ApiProperty({ description: 'Number of currently active employees' })
  active: number;

  @ApiProperty({ description: 'Number of inactive employees' })
  inactive: number;

  @ApiProperty({ description: 'Number of terminated employees' })
  terminated: number;

  @ApiProperty({ description: 'Distribution of employees by department (e.g. HR: 10, IT: 25)' })
  byDepartment: Record<string, number>;

  @ApiProperty({ description: 'Distribution of employees by role (e.g. Developer: 20, Manager: 5)' })
  byRole: Record<string, number>;

  @ApiProperty({ description: 'Distribution of employees by gender (e.g. male: 15, female: 10)' })
  byGender: Record<string, number>;

  @ApiProperty({ description: 'Distribution of employees by employment type (full-time, part-time)' })
  byEmploymentType: Record<string, number>;

  @ApiProperty({ description: 'Distribution of employees by work mode (hybrid, remote, on-site)' })
  byModeOfWork: Record<string, number>;

  @ApiProperty({ description: 'Distribution of employees by marital status (single, married)' })
  byMaritalStatus: Record<string, number>;

  @ApiProperty({ description: 'Average age of employees' })
  averageAge: number;

  @ApiProperty({ description: 'Average bonus among employees' })
  averageBonus: number;

  @ApiProperty({
    description: 'Employee stats specific to the current month',
    example: { new: 3, active: 40, inactive: 2 },
  })
  thisMonth: {
    new: number;
    active: number;
    inactive: number;
  };
}

export class EmployeeStatisticsResponseDto {
  @ApiProperty({ type: () => EmployeeStatisticsDto })
  statistics: EmployeeStatisticsDto;
}
