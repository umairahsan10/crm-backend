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
    description: 'Project name or identifier',
    example: 'Project 5',
  })
  project_name: string;

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

