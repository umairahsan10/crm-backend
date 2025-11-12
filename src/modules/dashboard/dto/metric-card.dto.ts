import { ApiProperty } from '@nestjs/swagger';

export class MetricCardDto {
  @ApiProperty({ description: 'Card ID (1-4)', example: 1 })
  id: number;

  @ApiProperty({ description: 'Card title', example: 'Total Projects' })
  title: string;

  @ApiProperty({ description: 'Main value to display', example: '45' })
  value: string;

  @ApiProperty({ description: 'Subtitle or additional info', example: 'Assigned to you', required: false })
  subtitle?: string;

  @ApiProperty({ description: 'Change description from previous period', example: '+5 from last month', required: false })
  change?: string;

  @ApiProperty({ description: 'Type of change: positive, negative, or neutral', example: 'positive', enum: ['positive', 'negative', 'neutral'], required: false })
  changeType?: 'positive' | 'negative' | 'neutral';

  @ApiProperty({ description: 'Department this card belongs to (for Admin view)', example: 'Sales', required: false })
  department?: string;
}

