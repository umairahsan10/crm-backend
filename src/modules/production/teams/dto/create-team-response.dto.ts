import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Success message', example: 'Team "Development Team A" created successfully' })
  message: string;

  @ApiProperty({ description: 'Created team data' })
  data: {
    teamId: number;
    teamName: string;
    teamLead: {
      id: number;
      firstName: string;
      lastName: string;
    };
    productionUnit: {
      id: number;
      name: string;
    };
    employeeCount: number;
  };
}
