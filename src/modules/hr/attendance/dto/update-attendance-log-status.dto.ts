import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttendanceLogStatusDto {
  @ApiProperty({
    description: 'Updated attendance status for the employee',
    enum: ['present', 'late', 'half_day', 'absent'],
    example: 'late',
  })
  @IsString()
  @IsIn(['present', 'late', 'half_day', 'absent'])
  status: 'present' | 'late' | 'half_day' | 'absent';

  @ApiPropertyOptional({
    description: 'Reason for updating the attendance status (if applicable)',
    example: 'Employee forgot to check in on time',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'ID of the reviewer or manager approving or updating the status',
    example: 42,
  })
  @IsNumber()
  @Type(() => Number)
  reviewer_id: number;

  @ApiPropertyOptional({
    description: 'Manual check-in time (if the record needs correction)',
    example: '09:10',
  })
  @IsOptional()
  @IsString()
  checkin?: string;

  @ApiPropertyOptional({
    description: 'Manual check-out time (if applicable)',
    example: '17:45',
  })
  @IsOptional()
  @IsString()
  checkout?: string;
}
