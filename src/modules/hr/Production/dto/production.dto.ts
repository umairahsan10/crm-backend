import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';

export class CreateProductionDto {
  @IsInt()
  employeeId: number;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsInt()
  productionUnitId?: number;

  @IsOptional()
  @IsNumber()
  projectsCompleted?: number;
}

export class UpdateProductionDto {
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsInt()
  productionUnitId?: number;

  @IsOptional()
  @IsNumber()
  projectsCompleted?: number;
}

export class ProductionResponseDto {
  id: number;
  employeeId: number;
  specialization?: string | null;
  productionUnitId?: number | null;
  projectsCompleted?: number | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  productionUnit?: {
    id: number;
    name: string;
  } | null;
}

export class ProductionsListResponseDto {
  productions: ProductionResponseDto[];
  total: number;
} 