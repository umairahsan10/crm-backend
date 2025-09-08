import { IsNumber, IsPositive, IsDateString } from 'class-validator';

export class AssignUnitHeadDto {
  @IsNumber()
  @IsPositive()
  unitHeadId: number;

  @IsDateString()
  deadline: string;
}
