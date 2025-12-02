import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBonusDto {
  @ApiProperty({
    description: 'New bonus amount for the employee (must be non-negative)',
    example: 5000,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  bonus: number;
}
