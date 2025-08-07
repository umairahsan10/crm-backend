

export class EmployeeResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  gender: string;
  cnic?: string | null;
  departmentId: number;
  roleId: number;
  managerId?: number | null;
  teamLeadId?: number | null;
  address?: string | null;
  maritalStatus?: boolean | null;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  modeOfWork?: string | null;
  remoteDaysAllowed?: number | null;
  dob?: Date | null;
  emergencyContact?: string | null;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  employmentType?: string | null;
  dateOfConfirmation?: Date | null;
  periodType?: string | null;
  bonus?: number | null;
  createdAt: Date;
  updatedAt: Date;

  // Related data
  department?: {
    id: number;
    name: string;
    description?: string | null;
  };

  role?: {
    id: number;
    name: string;
    description?: string | null;
  };

  manager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  teamLead?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export class EmployeesListResponseDto {
  employees: EmployeeResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 