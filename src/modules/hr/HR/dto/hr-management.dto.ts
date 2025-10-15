import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHrDto {
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

  @ApiPropertyOptional({ description: 'Permission to approve monthly requests' })
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

export class UpdateHrDto {
  @ApiPropertyOptional({ description: 'Update permission to manage attendance' })
  @IsOptional()
  @IsBoolean()
  attendancePermission?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to handle salary' })
  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to manage commissions' })
  @IsOptional()
  @IsBoolean()
  commissionPermission?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to add employees' })
  @IsOptional()
  @IsBoolean()
  employeeAddPermission?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to handle terminations' })
  @IsOptional()
  @IsBoolean()
  terminationsHandle?: boolean;

  @ApiPropertyOptional({ description: 'Update permission to approve monthly requests' })
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

  @ApiPropertyOptional({ description: 'Update permission to manage shift timings' })
  @IsOptional()
  @IsBoolean()
  shiftTimingSet?: boolean;
}

export class HrResponseDto {
  @ApiProperty({ description: 'HR record ID' })
  id: number;

  @ApiProperty({ description: 'Employee ID associated with this HR record' })
  employeeId: number;

  @ApiPropertyOptional({ description: 'Permission to manage attendance' })
  attendancePermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to handle salary' })
  salaryPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage commissions' })
  commissionPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to add employees' })
  employeeAddPermission?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to handle terminations' })
  terminationsHandle?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to approve monthly requests' })
  monthlyRequestApprovals?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to set targets' })
  targetsSet?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to set bonuses' })
  bonusesSet?: boolean | null;

  @ApiPropertyOptional({ description: 'Permission to manage shift timings' })
  shiftTimingSet?: boolean | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Employee details associated with this HR record',
    type: Object,
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

export class HrListResponseDto {
  @ApiProperty({ type: [HrResponseDto], description: 'List of HR records' })
  hrRecords: HrResponseDto[];

  @ApiProperty({ description: 'Total number of HR records' })
  total: number;
}