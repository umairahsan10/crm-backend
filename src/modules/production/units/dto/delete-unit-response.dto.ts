import { ApiProperty } from '@nestjs/swagger';

export class DependencyDetailsDto {
  @ApiProperty({ description: 'Dependency count', example: 2 })
  count: number;

  @ApiProperty({ description: 'Dependency details', type: [Object] })
  details: Array<{
    id: number;
    name: string;
    status?: string;
  }>;
}

export class DependenciesDto {
  @ApiProperty({ description: 'Teams dependency', type: DependencyDetailsDto, required: false })
  teams?: DependencyDetailsDto;

  @ApiProperty({ description: 'Projects dependency', type: DependencyDetailsDto, required: false })
  projects?: DependencyDetailsDto;
}

export class DeleteUnitSuccessResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Unit deleted successfully' })
  message: string;
}

export class DeleteUnitErrorResponseDto {
  @ApiProperty({ description: 'Success status', example: false })
  success: boolean;

  @ApiProperty({ description: 'Error message', example: 'Cannot delete unit. Please reassign dependencies first.' })
  message: string;

  @ApiProperty({ description: 'Dependencies preventing deletion', type: DependenciesDto })
  dependencies: DependenciesDto;
}
