import { IsString, IsEmail, IsNumber, IsPositive, IsOptional, IsUrl } from 'class-validator';

export class UpdateUnitDto {
  @IsOptional()
  @IsString({ message: 'Unit name must be a string' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Head ID must be a number' })
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for logo' })
  logoUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for website' })
  website?: string;
}
