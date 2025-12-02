import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHrPermissionDto {
  @ApiProperty({ description: 'Employee ID associated with the HR record' })
  @IsInt()
  employeeId: number;

  @ApiPropertyOptional({ description: 'Permission to manage attendance' })
  @IsOptional()
  @IsBoolean()
  attendancePermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to handle salary' })
  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage commissions' })
  @IsOptional()
  @IsBoolean()
  commissionPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to add employees' })
  @IsOptional()
  @IsBoolean()
  employeeAddPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission to handle terminations' })
  @IsOptional()
  @IsBoolean()
  terminationsHandle?: boolean;

  @ApiPropertyOptional({
    description: 'Permission to approve monthly requests',
  })
  @IsOptional()
  @IsBoolean()
  monthlyRequestApprovals?: boolean;

  @ApiPropertyOptional({ description: 'Permission to set targets' })
  @IsOptional()
  @IsBoolean()
  targetsSet?: boolean;

  @ApiPropertyOptional({ description: 'Permission to set bonuses' })
  @IsOptional()
  @IsBoolean()
  bonusesSet?: boolean;

  @ApiPropertyOptional({ description: 'Permission to manage shift timings' })
  @IsOptional()
  @IsBoolean()
  shiftTimingSet?: boolean;
}
