import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class RemoveMemberDto {
  @ApiProperty({
    description: 'Employee ID to remove from the team',
    example: 1,
  })
  @IsNumber()
  @IsPositive({ message: 'Employee ID must be a positive number' })
  employeeId: number;
}
