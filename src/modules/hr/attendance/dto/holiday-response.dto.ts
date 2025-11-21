import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HolidayResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the holiday',
    example: 101,
  })
  holidayId: number;

  @ApiProperty({
    description: 'Name of the holiday',
    example: 'Independence Day',
  })
  holidayName: string;

  @ApiProperty({
    description: 'Date on which the holiday occurs',
    example: '2025-08-14T00:00:00.000Z',
  })
  holidayDate: Date;

  @ApiPropertyOptional({
    description: 'Optional description or note about the holiday',
    example: 'National public holiday observed across all offices.',
  })
  description?: string;

  @ApiProperty({
    description: 'Timestamp when the holiday record was created',
    example: '2025-07-01T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the holiday record was last updated',
    example: '2025-07-10T15:45:00.000Z',
  })
  updatedAt: Date;
}
