import { IsOptional, IsInt, IsNumber } from 'class-validator';

export class CreateProjectChatDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  participants?: number;

  @IsOptional()
  @IsInt()
  transferredFrom?: number;

  @IsOptional()
  @IsInt()
  transferredTo?: number;
}
