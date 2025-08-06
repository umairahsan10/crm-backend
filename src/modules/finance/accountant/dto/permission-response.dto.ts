export class PermissionsResponseDto {
    status: 'success' | 'error';
    message: string;
    employee_id?: number;
    updated_permissions?: {
      liabilities_permission: boolean;
      salary_permission: boolean;
      sales_permission: boolean;
      invoices_permission: boolean;
      expenses_permission: boolean;
      assets_permission: boolean;
      revenues_permission: boolean;
    };
    previous_permissions?: {
      liabilities_permission: boolean;
      salary_permission: boolean;
      sales_permission: boolean;
      invoices_permission: boolean;
      expenses_permission: boolean;
      assets_permission: boolean;
      revenues_permission: boolean;
    };
    already_set_permissions?: {
      liabilities_permission: boolean;
      salary_permission: boolean;
      sales_permission: boolean;
      invoices_permission: boolean;
      expenses_permission: boolean;
      assets_permission: boolean;
      revenues_permission: boolean;
    };
    error_code?: string;
  }
  