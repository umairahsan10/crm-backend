import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    enum: ['dep_manager', 'team_lead', 'senior', 'junior', 'unit_head'],
    example: 'dep_manager',
  })
  @IsEnum(['dep_manager', 'team_lead', 'senior', 'junior', 'unit_head'])
  name: 'dep_manager' | 'team_lead' | 'senior' | 'junior' | 'unit_head';

  @ApiPropertyOptional({
    description: 'Optional description for the role',
    example: 'Department manager role',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
