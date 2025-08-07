import { IsString, IsNotEmpty, IsEmail, IsNumber, IsPositive, IsOptional, IsUrl } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty({ message: 'Unit name is required' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for logo' })
  logoUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL for website' })
  website?: string;
}
