import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalesTeamDto {
  @ApiProperty({
    description: 'Name of the team',
    example: 'Alpha Team',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID of the sales unit to which this team belongs',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  salesUnitId: number;

  @ApiProperty({
    description: 'ID of the team lead',
    example: 7,
  })
  @IsNumber()
  @IsNotEmpty()
  teamLeadId: number;
}
