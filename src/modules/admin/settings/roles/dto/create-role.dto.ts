import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    enum: RoleName,
    example: 'dep_manager',
  })
  @IsEnum(RoleName)
  name: RoleName;

  @ApiPropertyOptional({
    description: 'Optional description for the role',
    example: 'Department manager role',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

