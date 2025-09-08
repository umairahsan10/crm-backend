import { IsNumber, IsPositive } from 'class-validator';

export class AssignTeamDto {
  @IsNumber()
  @IsPositive()
  teamId: number;
}
