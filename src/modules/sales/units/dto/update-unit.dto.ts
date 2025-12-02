import {
  IsString,
  IsEmail,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalesUnitDto {
  @ApiPropertyOptional({
    description: 'Name of the unit',
    example: 'Production Unit 1',
  })
  @IsOptional()
  @IsString({ message: 'Unit name must be a string' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Email of the unit',
    example: 'unit@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the unit',
    example: '+92-300-1234567',
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Address of the unit',
    example: '123 Street, City',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @ApiPropertyOptional({
    description: 'ID of the head of the unit (nullable)',
    example: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Head ID must be a number' })
  @ValidateIf((o) => o.headId !== null)
  @IsPositive({ message: 'Head ID must be a positive number or null' })
  headId?: number | null;

  @ApiPropertyOptional({
    description: 'Logo URL of the unit',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for logo' })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Website URL of the unit',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for website' })
  website?: string;
}
