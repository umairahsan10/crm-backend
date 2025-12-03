import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateProductionTeamDto {
  @ApiProperty({
    description: 'Name of the team',
    example: 'Development Team A',
  })
  @IsString()
  @IsNotEmpty({ message: 'Team name is required' })
  name: string;

  @ApiProperty({
    description: 'Employee ID who will be the team lead',
    example: 123,
  })
  @IsNumber()
  @IsPositive({ message: 'Team lead ID must be a positive number' })
  teamLeadId: number;

  @ApiProperty({
    description: 'Production unit ID to assign team to',
    example: 1,
  })
  @IsNumber()
  @IsPositive({ message: 'Production unit ID must be a positive number' })
  productionUnitId: number;
}
