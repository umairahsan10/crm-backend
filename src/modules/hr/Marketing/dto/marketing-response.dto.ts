import { ApiProperty } from '@nestjs/swagger';

export class MarketingRecordResponseDto {
  @ApiProperty({ description: 'Marketing record ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Employee ID associated with this record', example: 101 })
  employeeId: number;

  @ApiProperty({ description: 'Marketing unit ID', example: 5, required: false, nullable: true })
  marketingUnitId?: number | null;

  @ApiProperty({ description: 'Total campaigns run', example: 12, required: false, nullable: true })
  totalCampaignsRun?: number | null;

  @ApiProperty({ description: 'Platform focus (e.g., Facebook, Instagram)', example: 'Facebook', required: false, nullable: true })
  platformFocus?: string | null;

  @ApiProperty({ description: 'Record creation timestamp', example: '2025-10-16T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last updated timestamp', example: '2025-10-16T12:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ 
    type: () => Object,
    description: 'Employee details', 
    example: {
      id: 101,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    }, 
    required: false 
  })
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class MarketingRecordsListResponseDto {
  @ApiProperty({ type: [MarketingRecordResponseDto], description: 'List of marketing records' })
  marketingRecords: MarketingRecordResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 50 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of records per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}
