import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnitHeadDto {
  @ApiProperty({ description: 'Employee ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@company.com',
  })
  email?: string;
}

export class TeamLeadDto {
  @ApiProperty({ description: 'Employee ID', example: 456 })
  id: number;

  @ApiProperty({ description: 'First name', example: 'Jane' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Smith' })
  lastName: string;
}

export class TeamDto {
  @ApiProperty({ description: 'Team ID', example: 5 })
  id: number;

  @ApiProperty({ description: 'Team name', example: 'Development Team A' })
  name: string;

  @ApiProperty({ description: 'Team lead ID', example: 456 })
  teamLeadId: number;

  @ApiProperty({ description: 'Team lead details', type: TeamLeadDto })
  teamLead: TeamLeadDto;

  @ApiProperty({ description: 'Number of team members', example: 6 })
  employeeCount: number;

  @ApiProperty({ description: 'Number of projects', example: 2 })
  projectsCount: number;

  @ApiProperty({
    description: 'Team creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;
}

export class ClientDto {
  @ApiProperty({ description: 'Client ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Client name', example: 'ABC Company' })
  clientName: string;

  @ApiProperty({ description: 'Company name', example: 'ABC Corp' })
  companyName: string;
}

export class ProjectTeamDto {
  @ApiProperty({ description: 'Team ID', example: 5 })
  id: number;

  @ApiProperty({ description: 'Team name', example: 'Development Team A' })
  name: string;
}

export class ProjectDto {
  @ApiProperty({ description: 'Project ID', example: 101 })
  id: number;

  @ApiProperty({
    description: 'Project description',
    example: 'E-commerce website development',
  })
  description: string;

  @ApiProperty({ description: 'Project status', example: 'in_progress' })
  status: string;

  @ApiProperty({
    description: 'Project deadline',
    example: '2024-03-15T00:00:00Z',
  })
  deadline: string;

  @ApiProperty({ description: 'Live progress percentage', example: 65.5 })
  liveProgress: number;

  @ApiProperty({ description: 'Difficulty level', example: 'medium' })
  difficultyLevel: string;

  @ApiProperty({ description: 'Payment stage', example: 'in_between' })
  paymentStage: string;

  @ApiProperty({ description: 'Client details', type: ClientDto })
  client: ClientDto;

  @ApiProperty({ description: 'Team details', type: ProjectTeamDto })
  team: ProjectTeamDto;

  @ApiProperty({
    description: 'Project creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Project update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: string;
}

export class UnitListDto {
  @ApiProperty({ description: 'Unit ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Unit name',
    example: 'Frontend Development Unit',
  })
  name: string;

  @ApiProperty({ description: 'Unit head ID', example: 123 })
  headId: number;

  @ApiProperty({ description: 'Unit head details', type: UnitHeadDto })
  head: UnitHeadDto;

  @ApiProperty({ description: 'Number of teams', example: 3 })
  teamsCount: number;

  @ApiProperty({ description: 'Number of employees', example: 15 })
  employeesCount: number;

  @ApiProperty({ description: 'Number of projects', example: 5 })
  projectsCount: number;

  @ApiProperty({
    description: 'Unit creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Unit update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: string;
}

export class UnitDetailDto extends UnitListDto {
  @ApiProperty({ description: 'Teams in the unit', type: [TeamDto] })
  teams: TeamDto[];

  @ApiProperty({ description: 'Projects in the unit', type: [ProjectDto] })
  projects: ProjectDto[];
}

export class PaginationDto {
  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 1 })
  totalPages: number;
}

export class UnitListResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'List of units', type: [UnitListDto] })
  data: UnitListDto[];

  @ApiProperty({ description: 'Total number of units', example: 1 })
  total: number;

  @ApiProperty({ description: 'Pagination details', type: PaginationDto })
  pagination: PaginationDto;

  @ApiProperty({
    description: 'Response message',
    example: 'Units retrieved successfully',
  })
  message: string;
}

export class UnitDetailResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Unit details', type: UnitDetailDto })
  data: UnitDetailDto;

  @ApiProperty({
    description: 'Response message',
    example: 'Unit details retrieved successfully',
  })
  message: string;
}
