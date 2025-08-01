import { IsInt, IsNumber, IsEnum, Min } from 'class-validator';

export enum TransferDirection {
  RELEASE = 'release',
  WITHHOLD = 'withhold',
}

export class TransferCommissionDto {
  @IsInt()
  employee_id: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(TransferDirection)
  direction: TransferDirection;
}
