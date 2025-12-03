import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountantPermissionResponseDto {
  @ApiProperty({ description: 'Accountant ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Employee ID', example: 1 })
  employeeId: number;

  @ApiPropertyOptional({
    description: 'Permission to manage liabilities',
    example: true,
  })
  liabilitiesPermission?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to manage salary',
    example: true,
  })
  salaryPermission?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to manage sales',
    example: false,
  })
  salesPermission?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to manage invoices',
    example: true,
  })
  invoicesPermission?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to manage expenses',
    example: true,
  })
  expensesPermission?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to manage assets',
    example: false,
  })
  assetsPermission?: boolean | null;

  @ApiPropertyOptional({
    description: 'Permission to manage revenues',
    example: true,
  })
  revenuesPermission?: boolean | null;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Employee information',
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

export class AccountantPermissionsListResponseDto {
  @ApiProperty({
    description: 'List of accountants',
    type: [AccountantPermissionResponseDto],
  })
  accountants: AccountantPermissionResponseDto[];

  @ApiProperty({ description: 'Total number of accountants', example: 10 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;
}
