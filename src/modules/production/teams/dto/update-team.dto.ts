import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class UpdateTeamDto {
  @ApiPropertyOptional({
    description: 'Updated name of the team',
    example: 'Advanced Development Team',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Employee ID of the team lead (can be null to remove lead)',
    example: 5,
  })
  @IsOptional()
  @ValidateIf((o) => o.teamLeadId !== null && o.teamLeadId !== undefined)
  @IsNumber()
  @IsPositive({ message: 'Team lead ID must be a positive number' })
  teamLeadId?: number;
}
