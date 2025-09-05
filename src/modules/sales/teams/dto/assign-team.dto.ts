import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignTeamDto {
  @IsNumber()
  @IsNotEmpty()
  teamId: number;

  @IsNumber()
  @IsNotEmpty()
  salesUnitId: number;
}
