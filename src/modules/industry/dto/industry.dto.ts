import { IsNotEmpty, IsString, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for creating an industry
export class CreateIndustryDto {
  @ApiProperty({
    description: 'Name of the industry',
    minLength: 3,
    maxLength: 150,
    example: 'Software'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Industry name must be at least 3 characters long' })
  @MaxLength(150, { message: 'Industry name cannot exceed 150 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the industry',
    maxLength: 500,
    example: 'Software development companies and IT service providers'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}

// DTO for updating an industry - all fields optional
export class UpdateIndustryDto {
  @ApiPropertyOptional({
    description: 'Name of the industry',
    minLength: 3,
    maxLength: 150,
    example: 'Software'
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Industry name must be at least 3 characters long' })
  @MaxLength(150, { message: 'Industry name cannot exceed 150 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the industry',
    maxLength: 500,
    example: 'Software development companies and IT service providers'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the industry is active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

