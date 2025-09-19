export class DepartmentResponseDto {
  id: number;
  name: string;
  description?: string | null;
  managerId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  manager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  employees?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }[];
}

export class DepartmentsListResponseDto {
  departments: DepartmentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
