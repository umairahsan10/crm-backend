import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';

export class CampaignResponseDto {
  @ApiProperty({ example: 1, description: 'Unique ID of the campaign' })
  id: number;

  @ApiProperty({ example: 'Summer Marketing Blitz', description: 'Name of the campaign' })
  campaignName: string;

  @ApiProperty({ example: 'digital', description: 'Type of campaign (e.g., digital, print)' })
  campaignType: string;

  @ApiProperty({ example: '2025-06-01', description: 'Start date of the campaign (ISO format)' })
  startDate: Date;

  @ApiProperty({ example: '2025-09-30', description: 'End date of the campaign (ISO format)' })
  endDate: Date;

  @ApiProperty({ enum: CampaignStatus, description: 'Current status of the campaign' })
  status: CampaignStatus;

  @ApiProperty({ example: 25000, description: 'Planned campaign budget' })
  budget: number;

  @ApiPropertyOptional({ example: 22000, description: 'Actual cost incurred during the campaign' })
  actualCost?: number;

  @ApiProperty({ example: 3, description: 'ID of the marketing unit associated with the campaign' })
  unitId: number;

  @ApiPropertyOptional({ example: 'Campaign focusing on brand awareness', description: 'Brief description of the campaign' })
  description?: string;

  @ApiProperty({ example: '2025-05-01T10:00:00Z', description: 'Timestamp when the campaign record was created' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-15T18:30:00Z', description: 'Timestamp when the campaign record was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: 7, description: 'ID of the production unit (if any)' })
  productionUnitId?: number;

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Details of the associated marketing unit',
    example: { id: 3, name: 'Marketing Unit A' },
  })
  marketingUnit?: {
    id: number;
    name: string;
  };

  @ApiPropertyOptional({
    type: () => Object,
    description: 'Details of the associated production unit',
    example: { id: 7, name: 'Production Unit X' },
  })
  productionUnit?: {
    id: number;
    name: string;
  };
}

export class CampaignListResponseDto {
  @ApiProperty({ type: [CampaignResponseDto], description: 'List of campaigns in the current page' })
  campaigns: CampaignResponseDto[];

  @ApiProperty({ example: 120, description: 'Total number of campaigns found' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of campaigns per page' })
  limit: number;

  @ApiProperty({ example: 12, description: 'Total number of pages available' })
  totalPages: number;
}
