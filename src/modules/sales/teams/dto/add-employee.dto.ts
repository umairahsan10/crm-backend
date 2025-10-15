import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddEmployeeDto {
  @ApiProperty({
    description: 'ID of the employee to add',
    example: 123,
  })
  @IsNumber()
  @IsNotEmpty()
  employeeId: number;
}
