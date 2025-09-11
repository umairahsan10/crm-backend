import { IsNumber, IsPositive } from 'class-validator';

export class CreateProjectFromPaymentDto {
  @IsNumber()
  @IsPositive()
  crackedLeadId: number;

  @IsNumber()
  @IsPositive()
  clientId: number;

  @IsNumber()
  @IsPositive()
  salesRepId: number;

  @IsNumber()
  @IsPositive()
  amount: number;
}
