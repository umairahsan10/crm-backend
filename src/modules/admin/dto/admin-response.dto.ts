export class AdminResponseDto {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminListResponseDto {
  admins: AdminResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
