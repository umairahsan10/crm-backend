import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkLiabilityPaidDto {
  @ApiProperty({
    example: 301,
    description: 'ID of the liability to mark as paid',
  })
  @IsNumber()
  @IsPositive()
  liability_id: number;

  @ApiPropertyOptional({
    example: 101,
    description:
      'Optional ID of an existing transaction to link with the liability',
  })
  @IsOptional()
  @IsNumber()
  transactionId?: number;
}
