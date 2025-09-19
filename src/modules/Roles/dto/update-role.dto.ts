import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsEnum(['dep_manager', 'team_lead', 'senior', 'junior', 'unit_head'])
  name?: 'dep_manager' | 'team_lead' | 'senior' | 'junior' | 'unit_head';

  @IsOptional()
  @IsString()
  description?: string;
}
