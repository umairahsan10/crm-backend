import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountantDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsInt()
  employeeId: number;

  @ApiPropertyOptional({ description: 'Permission to manage liabilities', example: true })
  @IsOptional()
  @IsBoolean()
  liabilitiesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage salary', example: true })
  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage sales', example: false })
  @IsOptional()
  @IsBoolean()
  salesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage invoices', example: true })
  @IsOptional()
  @IsBoolean()
  invoicesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage expenses', example: true })
  @IsOptional()
  @IsBoolean()
  expensesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage assets', example: false })
  @IsOptional()
  @IsBoolean()
  assetsPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage revenues', example: true })
  @IsOptional()
  @IsBoolean()
  revenuesPermission?: boolean;
}

export class UpdateAccountantDto {
  @ApiPropertyOptional({ description: 'Permission to manage liabilities', example: true })
  @IsOptional()
  @IsBoolean()
  liabilitiesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage salary', example: true })
  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage sales', example: false })
  @IsOptional()
  @IsBoolean()
  salesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage invoices', example: true })
  @IsOptional()
  @IsBoolean()
  invoicesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage expenses', example: true })
  @IsOptional()
  @IsBoolean()
  expensesPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage assets', example: false })
  @IsOptional()
  @IsBoolean()
  assetsPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage revenues', example: true })
  @IsOptional()
  @IsBoolean()
  revenuesPermission?: boolean;
}

export class AccountantResponseDto {
  @ApiProperty({ description: 'Accountant ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Employee ID', example: 1 })
  employeeId: number;

  @ApiPropertyOptional({ description: 'Permission to manage liabilities', example: true })
  liabilitiesPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage salary', example: true })
  salaryPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage sales', example: false })
  salesPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage invoices', example: true })
  invoicesPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage expenses', example: true })
  expensesPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage assets', example: false })
  assetsPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage revenues', example: true })
  revenuesPermission?: boolean | null;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'Employee information',
    example: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    }
  })
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class AccountantListResponseDto {
  @ApiProperty({ description: 'List of accountants', type: [AccountantResponseDto] })
  accountants: AccountantResponseDto[];

  @ApiProperty({ description: 'Total number of accountants', example: 10 })
  total: number;
} 