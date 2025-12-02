import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductionDto {
  @ApiProperty({
    description: 'Employee ID for this production record',
    example: 101,
  })
  @IsInt()
  employeeId: number;

  @ApiProperty({
    description: 'Specialization of the employee',
    example: 'Quality Control',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({
    description: 'Production unit ID',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  productionUnitId?: number;

  @ApiProperty({
    description: 'Number of projects completed',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  projectsCompleted?: number;
}

export class UpdateProductionDto {
  @ApiProperty({
    description: 'Specialization of the employee',
    example: 'Quality Control',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({
    description: 'Production unit ID',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  productionUnitId?: number;

  @ApiProperty({
    description: 'Number of projects completed',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  projectsCompleted?: number;
}

export class ProductionResponseDto {
  @ApiProperty({ description: 'Production record ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Employee ID associated with this record',
    example: 101,
  })
  employeeId: number;

  @ApiProperty({
    description: 'Specialization',
    example: 'Quality Control',
    required: false,
    nullable: true,
  })
  specialization?: string | null;

  @ApiProperty({
    description: 'Production unit ID',
    example: 5,
    required: false,
    nullable: true,
  })
  productionUnitId?: number | null;

  @ApiProperty({
    description: 'Projects completed',
    example: 12,
    required: false,
    nullable: true,
  })
  projectsCompleted?: number | null;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2025-10-16T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Record last updated timestamp',
    example: '2025-10-16T12:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    type: () => Object,
    description: 'Employee details',
    required: false,
    example: {
      id: 101,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  })
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({
    type: () => Object,
    description: 'Production unit details',
    required: false,
    nullable: true,
    example: {
      id: 5,
      name: 'Assembly Unit',
    },
  })
  productionUnit?: {
    id: number;
    name: string;
  } | null;
}

export class ProductionsListResponseDto {
  @ApiProperty({
    description: 'List of production records',
    type: [ProductionResponseDto],
  })
  productions: ProductionResponseDto[];

  @ApiProperty({
    description: 'Total number of production records',
    example: 50,
  })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of records per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}
