import { IsInt, IsObject, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionsDto {
  @IsOptional()
  @IsBoolean()
  liabilities_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  salary_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  sales_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  invoices_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  expenses_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  assets_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  revenues_permission?: boolean;
}

export class UpdatePermissionsDto {
  @IsInt()
  employee_id: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions: PermissionsDto;
}
