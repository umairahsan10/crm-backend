import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountantPermissionDto {
  @ApiPropertyOptional({
    description: 'Permission to manage liabilities',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  liabilitiesPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to manage salary',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to manage sales',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  salesPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to manage invoices',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  invoicesPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to manage expenses',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  expensesPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to manage assets',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  assetsPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to manage revenues',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  revenuesPermission?: boolean;
}
