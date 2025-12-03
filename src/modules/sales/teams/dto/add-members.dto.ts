import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class SalesAddMembersDto {
  @ApiProperty({
    description: 'Array of employee IDs to add to the team',
    example: [123, 456, 789],
    type: [Number],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'At least one employee ID is required' })
  @ArrayMaxSize(20, { message: 'Cannot add more than 20 employees at once' })
  employeeIds: number[];
}
