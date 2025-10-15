import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplaceTeamLeadDto {
  @ApiProperty({
    description: 'ID of the new team lead to replace the current one',
    example: 12,
  })
  @IsNumber()
  @IsNotEmpty()
  newTeamLeadId: number;
}
