import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class AddTeamDto {
  @ApiProperty({ description: 'Team ID to add to the unit', example: 1 })
  @IsNumber()
  @IsPositive({ message: 'Team ID must be a positive number' })
  teamId: number;
}
