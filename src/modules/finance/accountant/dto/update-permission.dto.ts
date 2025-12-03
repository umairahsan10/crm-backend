import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsBoolean,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Permission to manage liabilities',
  })
  @IsOptional()
  @IsBoolean()
  liabilities_permission?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Permission to manage salaries',
  })
  @IsOptional()
  @IsBoolean()
  salary_permission?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Permission to manage sales',
  })
  @IsOptional()
  @IsBoolean()
  sales_permission?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Permission to manage invoices',
  })
  @IsOptional()
  @IsBoolean()
  invoices_permission?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Permission to manage expenses',
  })
  @IsOptional()
  @IsBoolean()
  expenses_permission?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Permission to manage assets',
  })
  @IsOptional()
  @IsBoolean()
  assets_permission?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Permission to manage revenues',
  })
  @IsOptional()
  @IsBoolean()
  revenues_permission?: boolean;
}

export class UpdatePermissionsDto {
  @ApiProperty({
    example: 123,
    description: 'Employee ID whose permissions are being updated',
  })
  @IsInt()
  employee_id: number;

  @ApiProperty({
    description: 'Object containing permission flags for the employee',
    type: PermissionsDto,
    example: {
      liabilities_permission: true,
      salary_permission: false,
      sales_permission: true,
      invoices_permission: true,
      expenses_permission: true,
      assets_permission: false,
      revenues_permission: true,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions: PermissionsDto;
}
