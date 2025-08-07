import { IsInt } from 'class-validator';

export class AssignCommissionDto {
  @IsInt()
  project_id: number;
}
