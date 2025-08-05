import { IsNumber, IsPositive } from 'class-validator';

export class AssignHeadDto {
  @IsNumber()
  @IsPositive()
  headId: number;
} 