import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    enum: ['dep_manager', 'team_lead', 'senior', 'junior', 'unit_head'],
    example: 'team_lead',
  })
  @IsOptional()
  @IsEnum(['dep_manager', 'team_lead', 'senior', 'junior', 'unit_head'])
  name?: 'dep_manager' | 'team_lead' | 'senior' | 'junior' | 'unit_head';

  @ApiPropertyOptional({ example: 'Team lead role' })
  @IsOptional()
  @IsString()
  description?: string;
}
