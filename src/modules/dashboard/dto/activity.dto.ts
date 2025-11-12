import { ApiProperty } from '@nestjs/swagger';

export class RelatedEntityDto {
  @ApiProperty({ description: 'Entity type', example: 'employee' })
  type: string;

  @ApiProperty({ description: 'Entity ID', example: 456 })
  id: number;

  @ApiProperty({ description: 'Entity name', example: 'Jane Smith', required: false })
  name?: string;
}

export class ActivityDto {
  @ApiProperty({ description: 'Activity ID', example: 'hr_log_123' })
  id: string;

  @ApiProperty({ description: 'Activity type', example: 'HR Activity' })
  type: string;

  @ApiProperty({ description: 'Activity title', example: 'Employee Created' })
  title: string;

  @ApiProperty({ description: 'Activity description', example: 'John Doe created new employee Jane Smith' })
  description: string;

  @ApiProperty({ description: 'Activity timestamp', example: '2025-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Who performed the activity', example: 'John Doe' })
  actor: string;

  @ApiProperty({ description: 'Department this activity belongs to (for Admin view)', example: 'Sales', required: false })
  department?: string;

  @ApiProperty({ description: 'Related entity info', type: RelatedEntityDto, required: false })
  relatedEntity?: RelatedEntityDto;
}

