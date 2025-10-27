import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsNumber, IsPositive } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ description: 'Name of the team', example: 'Development Team A' })
  @IsString()
  @IsNotEmpty({ message: 'Team name is required' })
  name: string;

  @ApiPropertyOptional({ description: 'Employee ID of the team lead', example: 5 })
  @IsOptional()
  @ValidateIf((o) => o.teamLeadId !== null && o.teamLeadId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Team lead ID must be a positive number' })
  teamLeadId?: number;

  @ApiPropertyOptional({ description: 'Production unit ID to assign team to', example: 1 })
  @IsOptional()
  @ValidateIf((o) => o.productionUnitId !== null && o.productionUnitId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Production unit ID must be a positive number' })
  productionUnitId?: number;
}
