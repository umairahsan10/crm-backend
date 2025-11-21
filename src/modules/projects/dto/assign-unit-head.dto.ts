import { IsNumber, IsPositive } from 'class-validator';

export class AssignUnitHeadDto {
  @IsNumber()
  @IsPositive()
  unitHeadId: number;
}
