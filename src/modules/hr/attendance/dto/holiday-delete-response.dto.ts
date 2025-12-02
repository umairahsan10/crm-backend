import { ApiProperty } from '@nestjs/swagger';

export class HolidayDeleteResponseDto {
  @ApiProperty({
    description: 'Confirmation message for holiday deletion',
    example: 'Holiday deleted successfully.',
  })
  message: string;

  @ApiProperty({ description: 'ID of the deleted holiday', example: 101 })
  holidayId: number;

  @ApiProperty({
    description: 'Timestamp when the holiday was deleted',
    example: '2025-07-10T15:45:00.000Z',
  })
  deletedAt: string;
}
