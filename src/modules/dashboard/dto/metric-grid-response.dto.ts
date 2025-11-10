import { ApiProperty } from '@nestjs/swagger';
import { MetricCardDto } from './metric-card.dto';

export class MetricGridResponseDto {
  @ApiProperty({ description: 'User department', example: 'Production' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'team_lead' })
  role: string;

  @ApiProperty({ description: 'Dashboard metric cards', type: [MetricCardDto] })
  cards: MetricCardDto[];
}

