import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Number of records per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total number of records' })
  total: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: 10, description: 'Number of records retrieved on current page' })
  retrieved: number;
}
