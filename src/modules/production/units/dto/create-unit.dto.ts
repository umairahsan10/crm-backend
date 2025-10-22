import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, ValidateIf } from 'class-validator';

export class CreateProductionUnitDto {
  @ApiProperty({ 
    description: 'Name of the production unit', 
    example: 'Frontend Development Unit' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Unit name is required' })
  name: string;

  @ApiProperty({ 
    description: 'Employee ID who will become the unit head', 
    example: 123 
  })
  @IsNumber()
  @IsPositive({ message: 'Head ID must be a positive number' })
  headId: number;

  @ApiPropertyOptional({ 
    description: 'Employee ID who will become the new team lead (only for team lead promotion scenario)', 
    example: 456 
  })
  @IsOptional()
  @ValidateIf((o) => o.newTeamLeadId !== null && o.newTeamLeadId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'New team lead ID must be a positive number' })
  newTeamLeadId?: number;
} 