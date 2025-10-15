import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeamDto {
  @ApiProperty({
    description: 'ID of the team to assign',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  teamId: number;

  @ApiProperty({
    description: 'ID of the sales unit the team will be assigned to',
    example: 12,
  })
  @IsNumber()
  @IsNotEmpty()
  salesUnitId: number;
}
