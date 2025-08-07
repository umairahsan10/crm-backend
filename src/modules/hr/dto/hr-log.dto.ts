export class HrLogResponseDto {
  id: number;
  actionType: string | null;
  affectedEmployeeId: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  affectedEmployee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  hr?: {
    id: number;
    employee: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export class HrLogsResponseDto {
  logs: HrLogResponseDto[];
} 