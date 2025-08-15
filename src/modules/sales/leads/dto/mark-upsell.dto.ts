import { IsNotEmpty, IsString } from 'class-validator';

export class MarkUpsellDto {
  @IsNotEmpty()
  @IsString()
  comment: string;
}
