import { ApiProperty } from '@nestjs/swagger';

export class AdminResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the admin user',
  })
  id: number;

  @ApiProperty({
    example: 'John',
    nullable: true,
    description: 'First name of the admin',
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    nullable: true,
    description: 'Last name of the admin',
  })
  lastName: string | null;

  @ApiProperty({
    example: 'john.doe@example.com',
    nullable: true,
    description: 'Email address of the admin',
  })
  email: string | null;

  @ApiProperty({
    example: 'super_admin',
    nullable: true,
    description: 'Role or access level of the admin',
  })
  role: string | null;

  @ApiProperty({
    example: '2025-10-14T08:30:00.000Z',
    description: 'Date when the admin was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-10-14T10:45:00.000Z',
    description: 'Date when the admin record was last updated',
  })
  updatedAt: Date;
}

export class AdminListResponseDto {
  @ApiProperty({
    type: [AdminResponseDto],
    description: 'List of admin records',
  })
  admins: AdminResponseDto[];

  @ApiProperty({ example: 50, description: 'Total number of admins found' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Total number of pages available' })
  totalPages: number;
}
