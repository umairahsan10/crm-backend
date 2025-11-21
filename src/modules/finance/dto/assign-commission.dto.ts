import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCommissionDto {
  @ApiProperty({ example: 1, description: 'ID of the commission' })
  @IsInt()
  project_id: number;
}
