export class CompanyResponseDto {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
  quarterlyLeavesDays: number;
  monthlyLatesDays: number;
  absentDeduction: number;
  lateDeduction: number;
  halfDeduction: number;
  taxId?: string;
  lateTime: number;
  halfTime: number;
  absentTime: number;
}
