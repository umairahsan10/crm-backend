import { ApiProperty } from '@nestjs/swagger';

export class ProjectLogsListResponseDto {
  @ApiProperty({
    description: 'Project log ID',
    example: 1,
  })
  project_log_id: number;

  @ApiProperty({
    description: 'Project ID',
    example: 5,
  })
  project_id: number;

  @ApiProperty({
    description: 'Developer/Employee ID',
    example: 123,
  })
  developer_id: number;

  @ApiProperty({
    description: 'Developer first name',
    example: 'Jane',
  })
  developer_first_name: string;

  @ApiProperty({
    description: 'Developer last name',
    example: 'Smith',
  })
  developer_last_name: string;

  @ApiProperty({
    description: 'Developer full name',
    example: 'Jane Smith',
  })
  developer_name: string;

  @ApiProperty({
    description: 'Developer email address',
    example: 'jane.smith@company.com',
  })
  developer_email: string;

  @ApiProperty({
    description: 'Project name or identifier',
    example: 'Project 5',
  })
  project_name: string;

  @ApiProperty({
    description: 'Project description',
    example: 'E-commerce platform development with payment integration',
    nullable: true,
  })
  project_description: string | null;

  @ApiProperty({
    description: 'Project deadline',
    example: '2025-12-31',
    nullable: true,
  })
  project_deadline: string | null;

  @ApiProperty({
    description: 'Project status',
    example: 'in_progress',
    nullable: true,
  })
  project_status: string | null;

  @ApiProperty({
    description: 'Date when the log was created',
    example: '2025-09-15T10:30:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Date when the log was last updated',
    example: '2025-09-15T10:30:00.000Z',
  })
  updated_at: string;
}

