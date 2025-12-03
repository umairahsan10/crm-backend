import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHrPermissionDto {
  @ApiPropertyOptional({
    description: 'Update permission to manage attendance',
  })
  @IsOptional()
  @IsBoolean()
  attendancePermission?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to handle salary' })
  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Update permission to manage commissions',
  })
  @IsOptional()
  @IsBoolean()
  commissionPermission?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to add employees' })
  @IsOptional()
  @IsBoolean()
  employeeAddPermission?: boolean;

  @ApiPropertyOptional({
    description: 'Update permission to handle terminations',
  })
  @IsOptional()
  @IsBoolean()
  terminationsHandle?: boolean;

  @ApiPropertyOptional({
    description: 'Update permission to approve monthly requests',
  })
  @IsOptional()
  @IsBoolean()
  monthlyRequestApprovals?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to set targets' })
  @IsOptional()
  @IsBoolean()
  targetsSet?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to set bonuses' })
  @IsOptional()
  @IsBoolean()
  bonusesSet?: boolean;

  @ApiPropertyOptional({
    description: 'Update permission to manage shift timings',
  })
  @IsOptional()
  @IsBoolean()
  shiftTimingSet?: boolean;
}
