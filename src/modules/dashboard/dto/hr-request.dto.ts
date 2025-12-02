import { ApiProperty } from '@nestjs/swagger';

export class HrRequestDto {
  @ApiProperty({ description: 'Request ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Request title', example: 'Leave Application' })
  title: string;

  @ApiProperty({ description: 'Employee name', example: 'Mike Johnson' })
  employee: string;

  @ApiProperty({ description: 'Department name', example: 'Sales' })
  department: string;

  @ApiProperty({
    description: 'Request type',
    enum: ['Leave', 'Salary', 'Training', 'Complaint', 'Other'],
    example: 'Leave',
  })
  type: 'Leave' | 'Salary' | 'Training' | 'Complaint' | 'Other';

  @ApiProperty({
    description: 'Request status',
    enum: ['Pending', 'Approved', 'Rejected', 'Under Review'],
    example: 'Pending',
  })
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

  @ApiProperty({
    description: 'Request priority',
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    example: 'Medium',
  })
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';

  @ApiProperty({
    description: 'Submitted date (relative time)',
    example: '2 hours ago',
  })
  submittedDate: string;

  @ApiProperty({
    description: 'Request description',
    example: 'Requesting 3 days leave for personal reasons',
  })
  description: string;
}

export class HrRequestsResponseDto {
  @ApiProperty({ description: 'User department', example: 'HR' })
  department: string;

  @ApiProperty({ description: 'User role', example: 'dep_manager' })
  role: string;

  @ApiProperty({
    description: 'List of HR requests (for HR users)',
    type: [HrRequestDto],
    required: false,
  })
  requests?: HrRequestDto[];

  @ApiProperty({
    description: 'Separated requests for Admin users',
    required: false,
    example: {
      employeeToHr: [],
      hrToAdmin: [],
    },
  })
  requestsByType?: {
    employeeToHr: HrRequestDto[];
    hrToAdmin: HrRequestDto[];
  };

  @ApiProperty({ description: 'Total requests count', example: 15 })
  total: number;
}
