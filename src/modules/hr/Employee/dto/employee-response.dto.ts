import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'Unique employee ID' })
  id: number;

  @ApiProperty({ description: 'First name of the employee' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the employee' })
  lastName: string;

  @ApiProperty({ description: 'Official email of the employee' })
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  phone?: string | null;

  @ApiProperty({ description: 'Gender of the employee' })
  gender: string;

  @ApiPropertyOptional({ description: 'CNIC or national ID number' })
  cnic?: string | null;

  @ApiProperty({ description: 'Department ID where the employee works' })
  departmentId: number;

  @ApiProperty({ description: 'Role ID assigned to the employee' })
  roleId: number;

  @ApiPropertyOptional({ description: 'Manager ID if applicable' })
  managerId?: number | null;

  @ApiPropertyOptional({ description: 'Team Lead ID if applicable' })
  teamLeadId?: number | null;

  @ApiPropertyOptional({ description: 'Residential address of the employee' })
  address?: string | null;

  @ApiPropertyOptional({
    description: 'Marital status (true = married, false = single)',
  })
  maritalStatus?: boolean | null;

  @ApiProperty({
    description: 'Employment status (e.g., active, terminated, inactive)',
  })
  status: string;

  @ApiPropertyOptional({ description: 'Employment start date' })
  startDate?: Date | null;

  @ApiPropertyOptional({ description: 'Employment end date if applicable' })
  endDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Work mode (hybrid, on_site, or remote)',
  })
  modeOfWork?: string | null;

  @ApiPropertyOptional({
    description: 'Number of remote days allowed per month',
  })
  remoteDaysAllowed?: number | null;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dob?: Date | null;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  emergencyContact?: string | null;

  @ApiPropertyOptional({ description: 'Shift start time (HH:mm format)' })
  shiftStart?: string | null;

  @ApiPropertyOptional({ description: 'Shift end time (HH:mm format)' })
  shiftEnd?: string | null;

  @ApiPropertyOptional({
    description: 'Type of employment (full_time or part_time)',
  })
  employmentType?: string | null;

  @ApiPropertyOptional({ description: 'Date of confirmation' })
  dateOfConfirmation?: Date | null;

  @ApiPropertyOptional({
    description: 'Employment period type (probation, permanent, or notice)',
  })
  periodType?: string | null;

  @ApiPropertyOptional({ description: 'Bonus amount if applicable' })
  bonus?: number | null;

  @ApiProperty({ description: 'Date when the record was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the record was last updated' })
  updatedAt: Date;

  // Related data
  @ApiPropertyOptional({
    type: () => Object,
    description: 'Department details associated with the employee',
    example: {
      id: 3,
      name: 'Marketing',
      description: 'Marketing & communications team',
    },
  })
  department?: {
    id: number;
    name: string;
    description?: string | null;
  };

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Role details associated with the employee',
    example: {
      id: 7,
      name: 'Team Lead',
      description: 'Leads a small development team',
    },
  })
  role?: {
    id: number;
    name: string;
    description?: string | null;
  };

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Manager details if assigned',
    example: {
      id: 2,
      firstName: 'Sarah',
      lastName: 'Ali',
      email: 'sarah@company.com',
    },
  })
  manager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Team lead details if assigned',
    example: {
      id: 5,
      firstName: 'Ahmed',
      lastName: 'Raza',
      email: 'ahmed@company.com',
    },
  })
  teamLead?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export class LimitedEmployeeResponseDto {
  @ApiProperty({ description: 'Unique employee ID' })
  id: number;

  @ApiProperty({ description: 'First name of the employee' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the employee' })
  lastName: string;

  @ApiProperty({ description: 'Official email of the employee' })
  email: string;

  @ApiProperty({ description: 'Department ID where the employee works' })
  departmentId: number;

  @ApiProperty({ description: 'Role ID assigned to the employee' })
  roleId: number;

  @ApiProperty({
    description: 'Employment status (e.g., active, terminated, inactive)',
  })
  status: string;

  @ApiPropertyOptional({ description: 'Employment start date' })
  startDate?: Date | null;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Department details associated with the employee',
    example: { name: 'Marketing' },
  })
  department?: {
    name: string;
  };

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Role details associated with the employee',
    example: { name: 'Team Lead' },
  })
  role?: {
    name: string;
  };

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Manager details if assigned',
    example: { firstName: 'Sarah', lastName: 'Ali' },
  })
  manager?: {
    firstName: string;
    lastName: string;
  } | null;
}

export class EmployeesListResponseDto {
  @ApiProperty({
    type: [LimitedEmployeeResponseDto],
    description: 'List of employees in the current page',
  })
  employees: LimitedEmployeeResponseDto[];

  @ApiProperty({ description: 'Total number of employees found' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of records per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages available' })
  totalPages: number;
}
