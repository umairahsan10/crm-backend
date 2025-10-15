import { IsInt, IsString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaveAction {
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export class ProcessLeaveActionDto {
  @ApiProperty({
    enum: LeaveAction,
    description: 'Action to perform on the leave request',
    example: LeaveAction.APPROVED,
  })
  @IsEnum(['Approved', 'Rejected'])
  action: 'Approved' | 'Rejected';

  @ApiProperty({
    example: 42,
    description: 'ID of the reviewer performing the action',
  })
  @Type(() => Number)
  @IsInt()
  reviewer_id: number;

  @ApiPropertyOptional({
    example: 'Employee provided valid medical certificate',
    description: 'Reason or note for confirmation (optional)',
  })
  @IsOptional()
  @IsString()
  confirmation_reason?: string;
} 