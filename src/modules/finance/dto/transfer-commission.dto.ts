import { IsInt, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransferDirection {
  RELEASE = 'release',
  WITHHOLD = 'withhold',
}

export class TransferCommissionDto {
  @ApiProperty({ example: 1, description: 'ID of the employee' })
  @IsInt()
  employee_id: number;

  @ApiProperty({ example: 100.50, description: 'Amount to transfer' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: TransferDirection.RELEASE, enum: TransferDirection, description: 'Direction of the transfer' })
  @IsEnum(TransferDirection)
  direction: TransferDirection;
}
