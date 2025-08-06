import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { RequestType, AdminRequestStatus } from '@prisma/client';

export { RequestType, AdminRequestStatus };

export class CreateAdminRequestDto {
  @IsString()
  description: string;

  @IsEnum(RequestType)
  type: RequestType;

  @IsOptional()
  @IsInt()
  hrLogId?: number;
}

export class UpdateAdminRequestDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;
}

export class UpdateAdminRequestStatusDto {
  @IsEnum(AdminRequestStatus)
  status: AdminRequestStatus;
}

export class AdminRequestResponseDto {
  id: number;
  hrLogId: number | null;
  description: string | null;
  type: RequestType | null;
  status: AdminRequestStatus | null;
  createdAt: Date;
  updatedAt: Date;
  hrLog: {
    id: number;
    hrId: number;
    actionType: string | null;
    affectedEmployeeId: number | null;
    description: string | null;
    createdAt: Date;
  } | null;
}

export class AdminRequestListResponseDto {
  adminRequests: AdminRequestResponseDto[];
  total: number;
} 