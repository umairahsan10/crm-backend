import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, MinLength, IsNotEmpty, IsOptional } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class CreateAdminDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the admin (minimum 2 characters)',
    minLength: 2,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the admin (minimum 2 characters)',
    minLength: 2,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the admin',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password for the admin account (minimum 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: AdminRole,
    description: 'Role of the admin user',
    example: 'admin',
    default: 'admin',
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}

