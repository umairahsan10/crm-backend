export class EmployeeStatisticsDto {
  total: number;
  active: number;
  inactive: number;
  byDepartment: Record<string, number>;
  byRole: Record<string, number>;
  byGender: Record<string, number>;
  byEmploymentType: Record<string, number>;
  byModeOfWork: Record<string, number>;
  byMaritalStatus: Record<string, number>;
  averageAge: number;
  averageBonus: number;
  thisMonth: {
    new: number;
    active: number;
    inactive: number;
  };
}

export class EmployeeStatisticsResponseDto {
  statistics: EmployeeStatisticsDto;
}
