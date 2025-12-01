import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class AdminEmployeeBriefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;
}

export class AdminRoleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: RoleName, example: 'dep_manager' })
  name: RoleName;

  @ApiPropertyOptional({ example: 'Department manager role' })
  description?: string | null;

  @ApiProperty({ example: '2025-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-10T12:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [AdminEmployeeBriefDto] })
  employees?: AdminEmployeeBriefDto[];
}

export class AdminRolesListResponseDto {
  @ApiProperty({ type: [AdminRoleResponseDto] })
  roles: AdminRoleResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

