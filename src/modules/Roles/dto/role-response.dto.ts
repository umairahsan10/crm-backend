import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeBriefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;
}

export class RoleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'dep_manager' })
  name: string;

  @ApiPropertyOptional({ example: 'Department manager role' })
  description?: string | null;

  @ApiProperty({ example: '2025-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-10T12:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [EmployeeBriefDto] })
  employees?: EmployeeBriefDto[];
}

export class RolesListResponseDto {
  @ApiProperty({ type: [RoleResponseDto] })
  roles: RoleResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
