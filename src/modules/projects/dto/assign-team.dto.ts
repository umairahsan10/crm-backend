import { IsNumber, IsPositive, IsDateString } from 'class-validator';

export class AssignTeamDto {
  @IsNumber()
  @IsPositive()
  teamId: number;

  @IsDateString()
  deadline: string;
}
