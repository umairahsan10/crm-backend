import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingResponseDto {
  @ApiProperty({ description: 'Unique identifier for the meeting', example: 101 })
  id: number;

  @ApiPropertyOptional({ description: 'Employee ID associated with the meeting', example: 25 })
  employeeId?: number;

  @ApiPropertyOptional({ description: 'Client ID associated with the meeting', example: 42 })
  clientId?: number;

  @ApiPropertyOptional({ description: 'Project ID associated with the meeting', example: 7 })
  projectId?: number;

  @ApiPropertyOptional({ description: 'Meeting topic or title', example: 'Quarterly Sales Strategy Discussion' })
  topic?: string;

  @ApiPropertyOptional({ description: 'Scheduled date and time for the meeting', example: '2025-10-20T15:00:00Z' })
  dateTime?: Date;

  @ApiPropertyOptional({ description: 'Current status of the meeting', example: 'SCHEDULED' })
  status?: string;

  @ApiProperty({ description: 'Indicates whether automatic reminders are enabled', example: true })
  autoReminder: boolean;

  @ApiProperty({ description: 'Link to join the meeting', example: 'https://zoom.us/j/123456789' })
  meetingLink: string;

  @ApiProperty({ description: 'Date when the meeting record was created', example: '2025-10-10T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the meeting record was last updated', example: '2025-10-13T09:30:00Z' })
  updatedAt: Date;

  // Related data

  @ApiPropertyOptional({
    description: 'Employee details related to the meeting',
    example: {
      id: 25,
      firstName: 'Ayesha',
      lastName: 'Khan',
      email: 'ayesha.khan@company.com',
      department: { id: 3, name: 'Marketing' },
    },
  })
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Client details related to the meeting',
    example: {
      id: 42,
      clientName: 'John Doe',
      companyName: 'Acme Corp',
      email: 'john.doe@acme.com',
      phone: '+1-555-234-5678',
    },
  })
  client?: {
    id: number;
    clientName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };

  @ApiPropertyOptional({
    description: 'Project details associated with the meeting',
    example: {
      id: 7,
      description: 'Website Redesign Project',
      status: 'In Progress',
    },
  })
  project?: {
    id: number;
    description?: string;
    status?: string;
  };
}
