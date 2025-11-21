import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamLeadResponseDto {
  @ApiProperty({ description: 'Team lead ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'Team lead first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Team lead last name', example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Team lead email', example: 'john.doe@company.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Team lead phone', example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Team lead role information' })
  role?: {
    id: number;
    name: string;
  };
}

export class ProductionUnitResponseDto {
  @ApiProperty({ description: 'Production unit ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Production unit name', example: 'Frontend Development Unit' })
  name: string;

  @ApiPropertyOptional({ description: 'Production unit head information' })
  head?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export class TeamMemberResponseDto {
  @ApiProperty({ description: 'Employee ID', example: 456 })
  id: number;

  @ApiProperty({ description: 'Employee first name', example: 'Jane' })
  firstName: string;

  @ApiProperty({ description: 'Employee last name', example: 'Smith' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Employee email', example: 'jane.smith@company.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Employee phone', example: '+1234567891' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Employee role information' })
  role?: {
    id: number;
    name: string;
  };
}

export class ProjectResponseDto {
  @ApiProperty({ description: 'Project ID', example: 789 })
  id: number;

  @ApiPropertyOptional({ description: 'Project description', example: 'E-commerce website development' })
  description?: string;

  @ApiPropertyOptional({ description: 'Project status', example: 'in_progress' })
  status?: string;

  @ApiPropertyOptional({ description: 'Project progress percentage', example: 65.50 })
  liveProgress?: number;

  @ApiPropertyOptional({ description: 'Project deadline', example: '2024-03-15T00:00:00.000Z' })
  deadline?: Date;

  @ApiPropertyOptional({ description: 'Client information' })
  client?: {
    id: number;
    companyName?: string;
    clientName?: string;
    email?: string;
    phone?: string;
  };

  @ApiPropertyOptional({ description: 'Sales representative information' })
  salesRep?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class TeamListResponseDto {
  @ApiProperty({ description: 'Team ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Team name', example: 'Development Team A' })
  name: string;

  @ApiPropertyOptional({ description: 'Team lead ID', example: 123 })
  teamLeadId?: number;

  @ApiPropertyOptional({ description: 'Current project ID', example: 789 })
  currentProjectId?: number;

  @ApiPropertyOptional({ description: 'Employee count', example: 5 })
  employeeCount?: number;

  @ApiPropertyOptional({ description: 'Production unit ID', example: 1 })
  productionUnitId?: number;

  @ApiProperty({ description: 'Team creation date', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Team last update date', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Team lead information' })
  teamLead?: TeamLeadResponseDto;

  @ApiPropertyOptional({ description: 'Production unit information' })
  productionUnit?: ProductionUnitResponseDto;

  @ApiProperty({ description: 'Number of team members', example: 5 })
  membersCount: number;

  @ApiProperty({ description: 'Number of team projects', example: 3 })
  projectsCount: number;
}

export class TeamDetailResponseDto {
  @ApiProperty({ description: 'Team ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Team name', example: 'Development Team A' })
  name: string;

  @ApiPropertyOptional({ description: 'Team lead ID', example: 123 })
  teamLeadId?: number;

  @ApiPropertyOptional({ description: 'Current project ID', example: 789 })
  currentProjectId?: number;

  @ApiPropertyOptional({ description: 'Employee count', example: 5 })
  employeeCount?: number;

  @ApiPropertyOptional({ description: 'Production unit ID', example: 1 })
  productionUnitId?: number;

  @ApiProperty({ description: 'Team creation date', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Team last update date', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Team lead information' })
  teamLead?: TeamLeadResponseDto;

  @ApiPropertyOptional({ description: 'Production unit information' })
  productionUnit?: ProductionUnitResponseDto;

  @ApiProperty({ description: 'Number of team members', example: 5 })
  membersCount: number;

  @ApiProperty({ description: 'Number of team projects', example: 3 })
  projectsCount: number;

  @ApiProperty({ description: 'Team members list', type: [TeamMemberResponseDto] })
  members: TeamMemberResponseDto[];

  @ApiProperty({ description: 'Team projects list', type: [ProjectResponseDto] })
  projects: ProjectResponseDto[];
}
