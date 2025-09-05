import { IsNumber, IsNotEmpty } from 'class-validator';

export class ReplaceTeamLeadDto {
  @IsNumber()
  @IsNotEmpty()
  newTeamLeadId: number;
}
