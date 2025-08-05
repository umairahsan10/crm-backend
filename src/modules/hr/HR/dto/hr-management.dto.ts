import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateHrDto {
  @IsInt()
  employeeId: number;

  @IsOptional()
  @IsBoolean()
  attendancePermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  commissionPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  employeeAddPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  terminationsHandle?: boolean;

  @IsOptional()
  @IsBoolean()
  monthlyLeaveRequest?: boolean;

  @IsOptional()
  @IsBoolean()
  targetsSet?: boolean;

  @IsOptional()
  @IsBoolean()
  bonusesSet?: boolean;

  @IsOptional()
  @IsBoolean()
  shiftTimingSet?: boolean;
}

export class UpdateHrDto {
  @IsOptional()
  @IsBoolean()
  attendancePermission?: boolean;

  @IsOptional()
  @IsBoolean()
  salaryPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  commissionPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  employeeAddPermission?: boolean;

  @IsOptional()
  @IsBoolean()
  terminationsHandle?: boolean;

  @IsOptional()
  @IsBoolean()
  monthlyLeaveRequest?: boolean;

  @IsOptional()
  @IsBoolean()
  targetsSet?: boolean;

  @IsOptional()
  @IsBoolean()
  bonusesSet?: boolean;

  @IsOptional()
  @IsBoolean()
  shiftTimingSet?: boolean;
}

export class HrResponseDto {
  id: number;
  employeeId: number;
  attendancePermission?: boolean | null;
  salaryPermission?: boolean | null;
  commissionPermission?: boolean | null;
  employeeAddPermission?: boolean | null;
  terminationsHandle?: boolean | null;
  monthlyLeaveRequest?: boolean | null;
  targetsSet?: boolean | null;
  bonusesSet?: boolean | null;
  shiftTimingSet?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class HrListResponseDto {
  hrRecords: HrResponseDto[];
  total: number;
} 