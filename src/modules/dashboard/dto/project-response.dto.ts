import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({ description: 'Project name', example: 'E-commerce Platform' })
  name: string;

  @ApiProperty({ description: 'Project progress percentage', example: 85 })
  progress: number;

  @ApiProperty({ description: 'Project status', example: 'on-track', enum: ['on-track', 'ahead', 'delayed'] })
  status: 'on-track' | 'ahead' | 'delayed';

  @ApiProperty({ description: 'Project deadline', example: '2024-10-15' })
  deadline: string;

  @ApiProperty({ description: 'Team name', example: 'Frontend Team' })
  team: string;
}

export class ProjectsResponseDto {
  @ApiProperty({ description: 'List of projects (max 5: running projects first, then completed projects to fill remaining slots)', type: [ProjectDto] })
  projects: ProjectDto[];
}

