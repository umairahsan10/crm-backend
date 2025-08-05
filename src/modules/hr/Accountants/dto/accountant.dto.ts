import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateAccountantDto {
  @IsInt()
  employeeId: number;

  @IsOptional()
  @IsBoolean()
  taxPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  invoicesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  expensesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  assetsPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  revenuesPermission?: boolean;
}

export class UpdateAccountantDto {
  @IsOptional()
  @IsBoolean()
  taxPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  invoicesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  expensesPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  assetsPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  revenuesPermission?: boolean;
}

export class AccountantResponseDto {
  id: number;
  employeeId: number;
  taxPermission?: boolean | null;
  salaryPermission?: boolean | null;
  salesPermission?: boolean | null;
  invoicesPermission?: boolean | null;
  expensesPermission?: boolean | null;
  assetsPermission?: boolean | null;
  revenuesPermission?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class AccountantListResponseDto {
  accountants: AccountantResponseDto[];
  total: number;
} 