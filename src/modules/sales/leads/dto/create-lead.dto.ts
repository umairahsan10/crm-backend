import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail, IsNumber } from 'class-validator';
import { LeadSource, LeadType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiPropertyOptional({ description: 'Lead name', type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Lead email', type: String })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Lead phone number', type: String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Source of the lead', enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiProperty({ description: 'Type of the lead', enum: LeadType })
  @IsNotEmpty()
  @IsEnum(LeadType)
  type: LeadType;

  @ApiProperty({ description: 'ID of the sales unit this lead belongs to', type: Number })
  @IsNotEmpty()
  @IsNumber()
  salesUnitId: number;
}
