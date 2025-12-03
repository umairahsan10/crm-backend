import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkUpsellDto {
  @ApiProperty({
    description: 'Comment describing the upsell action',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  comment: string;
}
