import { ApiProperty } from '@nestjs/swagger';

export class PromotedEmployeeDto {
  @ApiProperty({ description: 'Employee ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'Employee full name', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Previous role (for direct promotion)',
    example: 'senior',
  })
  previousRole?: string;

  @ApiProperty({ description: 'New role', example: 'unit_head' })
  newRole: string;
}

export class NewTeamLeadDto {
  @ApiProperty({ description: 'Employee ID', example: 456 })
  id: number;

  @ApiProperty({ description: 'Employee full name', example: 'Jane Smith' })
  name: string;

  @ApiProperty({ description: 'New role', example: 'team_lead' })
  newRole: string;
}

export class OriginalTeamDto {
  @ApiProperty({ description: 'Team ID', example: 5 })
  id: number;

  @ApiProperty({ description: 'Team name', example: 'Development Team A' })
  name: string;

  @ApiProperty({ description: 'New team lead ID', example: 456 })
  newTeamLeadId: number;
}

export class CreateUnitDataDto {
  @ApiProperty({ description: 'Created unit ID', example: 1 })
  unitId: number;

  @ApiProperty({
    description: 'Created unit name',
    example: 'Frontend Development Unit',
  })
  unitName: string;

  @ApiProperty({
    description: 'Promoted employee details',
    type: PromotedEmployeeDto,
  })
  promotedEmployee: PromotedEmployeeDto;

  @ApiProperty({
    description: 'New team lead details (for team lead promotion)',
    type: NewTeamLeadDto,
    required: false,
  })
  newTeamLead?: NewTeamLeadDto;

  @ApiProperty({
    description: 'Original team details (for team lead promotion)',
    type: OriginalTeamDto,
    required: false,
  })
  originalTeam?: OriginalTeamDto;
}

export class CreateUnitResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example:
      "Production unit 'Frontend Development Unit' created successfully with team lead promotion",
  })
  message: string;

  @ApiProperty({ description: 'Response data', type: CreateUnitDataDto })
  data: CreateUnitDataDto;
}
