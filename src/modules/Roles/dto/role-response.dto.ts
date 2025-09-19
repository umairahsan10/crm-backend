export class RoleResponseDto {
  id: number;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  employees?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }[];
}

export class RolesListResponseDto {
  roles: RoleResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
