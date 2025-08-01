import { IsInt, IsBoolean } from 'class-validator';

export class UpdateWithholdFlagDto {
  @IsInt()
  employee_id: number;

  @IsBoolean()
  flag: boolean;
}
