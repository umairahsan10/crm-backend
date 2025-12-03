import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsPositive, ArrayMinSize } from 'class-validator';

export class AddMembersDto {
  @ApiProperty({
    description: 'Array of employee IDs to add to the team',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one employee ID is required' })
  @IsNumber({}, { each: true, message: 'Each employee ID must be a number' })
  @IsPositive({
    each: true,
    message: 'Each employee ID must be a positive number',
  })
  employeeIds: number[];
}
