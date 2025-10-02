import { IsNotEmpty, IsString, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';

// DTO for creating an industry
export class CreateIndustryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Industry name must be at least 3 characters long' })
  @MaxLength(150, { message: 'Industry name cannot exceed 150 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}

// DTO for updating an industry - all fields optional
export class UpdateIndustryDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Industry name must be at least 3 characters long' })
  @MaxLength(150, { message: 'Industry name cannot exceed 150 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

