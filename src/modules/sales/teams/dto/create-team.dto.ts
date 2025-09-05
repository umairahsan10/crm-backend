import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  salesUnitId: number;

  @IsNumber()
  @IsNotEmpty()
  teamLeadId: number;
}
