import { ApiProperty } from '@nestjs/swagger';

export class DeleteTeamSuccessResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Team deleted successfully',
  })
  message: string;
}

export class DeleteTeamErrorResponseDto {
  @ApiProperty({ description: 'Success status', example: false })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Cannot delete team. Team has dependencies.',
  })
  message: string;

  @ApiProperty({ description: 'Team information' })
  teamInfo: {
    id: number;
    name: string;
    teamLeadId?: number;
  };

  @ApiProperty({ description: 'Dependencies preventing deletion' })
  dependencies: {
    members: {
      count: number;
      details: Array<{
        id: number;
        employeeId: number;
        employeeName: string;
        email: string;
      }>;
    };
    projects: {
      count: number;
      details: Array<{
        id: number;
        description?: string;
        status?: string;
        deadline?: Date;
      }>;
    };
    summary: {
      totalMembers: number;
      totalProjects: number;
      hasMembers: boolean;
      hasProjects: boolean;
    };
  };

  @ApiProperty({
    description: 'Instructions to resolve dependencies',
    type: [String],
  })
  instructions: string[];
}
