import { ApiProperty } from '@nestjs/swagger';
import { ActivityDto } from './activity.dto';

export class ActivityFeedResponseDto {
  @ApiProperty({ description: 'User department', example: 'HR' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'dep_manager' })
  role: string;

  @ApiProperty({ description: 'Activity feed', type: [ActivityDto] })
  activities: ActivityDto[];

  @ApiProperty({ description: 'Total activities count', example: 50 })
  total: number;
}
