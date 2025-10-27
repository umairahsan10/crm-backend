import { IsNumber, IsPositive, IsDateString } from 'class-validator';

export class AssignProjectTeamDto {
  @IsNumber()
  @IsPositive()
  teamId: number;

  @IsDateString()
  deadline: string;
}
