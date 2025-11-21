import { IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWithholdFlagDto {
  @ApiProperty({ example: 1, description: 'ID of the employee' })
  @IsInt()
  employee_id: number;

  @ApiProperty({ example: true, description: 'Withhold flag status' })
  @IsBoolean()
  flag: boolean;
}
