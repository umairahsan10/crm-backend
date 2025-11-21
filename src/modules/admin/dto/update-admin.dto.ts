import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsEmail, MinLength } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class UpdateAdminDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the admin (minimum 2 characters)',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the admin (minimum 2 characters)',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address of the admin',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'securePassword123',
    description: 'Password for the admin account (minimum 6 characters)',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    enum: AdminRole,
    description: 'Role of the admin user (based on AdminRole enum from Prisma)',
    example: 'admin',
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
