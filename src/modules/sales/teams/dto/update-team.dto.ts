import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateSalesTeamDto {
  @ApiPropertyOptional({
    description: 'Updated team name',
    example: 'Enhanced Sales Team A',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Team name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Team name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'New team lead ID',
    example: 456,
  })
  @IsOptional()
  @IsNumber()
  teamLeadId?: number;

  @ApiPropertyOptional({
    description: 'Sales unit ID to assign the team to',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  salesUnitId?: number;
}
