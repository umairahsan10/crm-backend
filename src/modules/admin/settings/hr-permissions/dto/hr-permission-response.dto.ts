import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HrPermissionResponseDto {
  @ApiProperty({ description: 'HR record ID' })
  id: number;

  @ApiProperty({ description: 'Employee ID associated with this HR record' })
  employeeId: number;

  @ApiPropertyOptional({ description: 'Permission to manage attendance' })
  attendancePermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to handle salary' })
  salaryPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage commissions' })
  commissionPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to add employees' })
  employeeAddPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to handle terminations' })
  terminationsHandle?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to approve monthly requests',
  })
  monthlyRequestApprovals?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to set targets' })
  targetsSet?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to set bonuses' })
  bonusesSet?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage shift timings' })
  shiftTimingSet?: boolean | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Employee details associated with this HR record',
    example: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  })
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class HrPermissionsListResponseDto {
  @ApiProperty({
    type: [HrPermissionResponseDto],
    description: 'List of HR records',
  })
  hrRecords: HrPermissionResponseDto[];

  @ApiProperty({ description: 'Total number of HR records' })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;
}
