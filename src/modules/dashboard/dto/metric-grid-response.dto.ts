import { ApiProperty } from '@nestjs/swagger';
import { MetricCardDto } from './metric-card.dto';

export class MetricGridResponseDto {
  @ApiProperty({ description: 'User department', example: 'Production' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'team_lead' })
  role: string;

  @ApiProperty({ description: 'Dashboard metric cards', type: [MetricCardDto] })
  cards?: MetricCardDto[];

  @ApiProperty({
    description: 'Cards grouped by department (only for Admin users)',
    type: Object,
    isArray: false,
    required: false,
    example: {
      Admin: [],
      Sales: [],
      HR: [],
      Production: [],
      Accounts: [],
    },
  })
  cardsByDepartment?: {
    Admin?: MetricCardDto[];
    Sales?: MetricCardDto[];
    HR?: MetricCardDto[];
    Production?: MetricCardDto[];
    Accounts?: MetricCardDto[];
  };
}
