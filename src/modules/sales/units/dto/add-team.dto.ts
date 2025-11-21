import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTeamToSalesUnitDto {
  @ApiProperty({ description: 'Team ID to assign to the unit', example: 5 })
  @IsInt()
  teamId: number;
}
