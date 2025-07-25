import { IsOptional, IsInt } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsInt()
  unitHeadId?: number;
} 