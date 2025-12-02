import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { RoleName } from '@prisma/client';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    enum: RoleName,
    example: 'team_lead',
  })
  @IsOptional()
  @IsEnum(RoleName)
  name?: RoleName;

  @ApiPropertyOptional({ example: 'Team lead role' })
  @IsOptional()
  @IsString()
  description?: string;
}
