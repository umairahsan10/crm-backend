import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionsResponseDto {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: 'success' | 'error';

  @ApiProperty({ example: 'Permissions updated successfully', description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ example: 123, description: 'Employee ID for which permissions were updated' })
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Updated permissions after the operation',
    type: Object,
    example: { liabilities_permission: true, salary_permission: false, sales_permission: true, invoices_permission: true, expenses_permission: true, assets_permission: false, revenues_permission: true}
  })
  updated_permissions?: {
    liabilities_permission: boolean;
    salary_permission: boolean;
    sales_permission: boolean;
    invoices_permission: boolean;
    expenses_permission: boolean;
    assets_permission: boolean;
    revenues_permission: boolean;
  };

  @ApiPropertyOptional({
    description: 'Previous permissions before the update',
    type: Object,
    example: { liabilities_permission: false, salary_permission: false, sales_permission: false, invoices_permission: true, expenses_permission: true, assets_permission: false, revenues_permission: false }
  })
  previous_permissions?: {
    liabilities_permission: boolean;
    salary_permission: boolean;
    sales_permission: boolean;
    invoices_permission: boolean;
    expenses_permission: boolean;
    assets_permission: boolean;
    revenues_permission: boolean;
  };

  @ApiPropertyOptional({
    description: 'Permissions that were already set and not changed',
    type: Object,
    example: { liabilities_permission: true, salary_permission: false, sales_permission: true, invoices_permission: true, expenses_permission: true, assets_permission: false, revenues_permission: true}
  })
  already_set_permissions?: {
    liabilities_permission: boolean;
    salary_permission: boolean;
    sales_permission: boolean;
    invoices_permission: boolean;
    expenses_permission: boolean;
    assets_permission: boolean;
    revenues_permission: boolean;
  };

  @ApiPropertyOptional({ example: 'INVALID_PERMISSIONS', description: 'Error code if any' })
  error_code?: string;
}
