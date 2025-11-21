import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  ParseIntPipe, 
  Query, 
  Body, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  BadRequestException,
  ParseIntPipe as QueryParseIntPipe,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateHrRequestDto } from './dto/create-hr-request.dto';
import { EmployeeHrActionDto } from './dto/hr-action.dto';
import { HrRequestsFilterDto } from './dto/hr-requests-filter.dto';
import { PaginatedResponse } from './dto/paginated-response.dto';
import { RequestPriority, RequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Departments } from '../../../common/decorators/departments.decorator';

interface AuthenticatedRequest {
  user: {
    id: number;
    type: 'admin' | 'employee';
    role?: string;
    email?: string;
    department?: string;
    departmentId?: number;
  };
}

interface AuthenticatedRequest {
  user: {
    id: number;
    type: 'admin' | 'employee';
    role?: string;
    email?: string;
    department?: string;
    departmentId?: number;
  };
}

@ApiTags('Communication Employee')
@ApiBearerAuth()
@Controller('communication/employee')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('hr-requests')
  @Departments('HR', 'Admin')
  @ApiOperation({ 
    summary: 'Get HR requests with filtering and pagination', 
    description: 'Retrieve HR requests with optional filtering by status, priority, request type, date range, and search. Supports pagination.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of HR requests retrieved successfully. Returns paginated response when filters are applied.',
    type: PaginatedResponse
  })
  async getAllHrRequests(@Query() filterDto: HrRequestsFilterDto) {
    return this.employeeService.getAllHrRequests(filterDto);
  }

  @Get('hr-requests/my-requests')
  @Departments('HR', 'Admin', 'Development', 'Marketing', 'Sales', 'Production', 'Accounts')
  @ApiOperation({ summary: 'Get HR requests by employee', description: 'Returns all HR requests raised by a specific employee.' })
  @ApiQuery({ name: 'employeeId', type: Number, required: true, description: 'Employee ID to fetch HR requests for.' })
  @ApiResponse({ status: 200, description: 'Employee-specific HR requests retrieved successfully.' })
  async getMyHrRequests(@Query('employeeId', QueryParseIntPipe) employeeId: number) {
    return this.employeeService.getHrRequestsByEmployee(employeeId);
  }

  @Get('hr-requests/:id')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Get HR request by ID', description: 'Fetches a single HR request by its ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'HR request ID' })
  @ApiResponse({ status: 200, description: 'HR request retrieved successfully.' })
  async getHrRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.getHrRequestById(id);
  }

  @Get('hr-requests/priority/:priority')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Get HR requests by priority', description: 'Retrieves HR requests filtered by priority.' })
  @ApiParam({ name: 'priority', enum: RequestPriority, description: 'Priority level of HR requests.' })
  @ApiResponse({ status: 200, description: 'Filtered HR requests retrieved successfully.' })
  async getHrRequestsByPriority(@Param('priority') priority: RequestPriority) {
    return this.employeeService.getHrRequestsByPriority(priority);
  }

  @Get('hr-requests/status/:status')
  @Departments('HR')
  @ApiOperation({ summary: 'Get HR requests by status', description: 'Retrieves HR requests filtered by status (HR only).' })
  @ApiParam({ name: 'status', enum: RequestStatus, description: 'Status of HR requests.' })
  @ApiResponse({ status: 200, description: 'Filtered HR requests retrieved successfully.' })
  async getHrRequestsByStatus(@Param('status') status: RequestStatus) {
    return this.employeeService.getHrRequestsByStatus(status);
  }

  @Post('hr-requests')
  @HttpCode(HttpStatus.CREATED)
  @Departments('HR', 'Admin', 'Development', 'Marketing', 'Sales', 'Production', 'Accounts')
  @ApiOperation({ summary: 'Create a new HR request', description: 'Allows employees to raise a new HR request.' })
  @ApiBody({ type: CreateHrRequestDto })
  @ApiResponse({ status: 201, description: 'HR request created successfully.' })
  async createHrRequest(@Body() createHrRequestDto: CreateHrRequestDto) {
    return this.employeeService.createHrRequest(createHrRequestDto);
  }



  @Post('hr-requests/:id/action')
  @HttpCode(HttpStatus.OK)
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Take HR action on a request', description: 'HR personnel can take an action on a specific HR request.' })
  @ApiParam({ name: 'id', type: Number, description: 'HR request ID' })
  @ApiQuery({ name: 'hrEmployeeId', type: Number, required: true, description: 'ID of the HR employee taking action' })
  @ApiBody({ type: EmployeeHrActionDto })
  @ApiResponse({ status: 200, description: 'HR action successfully taken on the request.' })
  async takeHrAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() hrActionDto: EmployeeHrActionDto,
    @Query('hrEmployeeId', QueryParseIntPipe) hrEmployeeId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    // If admin user, use admin-specific action handler
    if (req.user.type === 'admin') {
      return this.employeeService.takeAdminAction(id, hrActionDto, req.user.id);
    }
    
    // For HR employees, require hrEmployeeId
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for taking actions');
    }
    
    return this.employeeService.takeHrAction(id, hrActionDto, hrEmployeeId);
  }

  @Put('hr-requests/:id/action')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Update HR action on a request', description: 'HR can update the status or details of an existing HR request.' })
  @ApiParam({ name: 'id', type: Number, description: 'HR request ID' })
  @ApiQuery({ name: 'hrEmployeeId', type: Number, required: true, description: 'ID of the HR employee updating the request' })
  @ApiBody({ type: EmployeeHrActionDto })
  @ApiResponse({ status: 200, description: 'HR action updated successfully.' })
  async updateHrRequestAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() hrActionDto: EmployeeHrActionDto,
    @Query('hrEmployeeId', QueryParseIntPipe) hrEmployeeId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    // If admin user, use admin-specific update handler
    if (req.user.type === 'admin') {
      return this.employeeService.updateAdminAction(id, hrActionDto, req.user.id);
    }
    
    // For HR employees, require hrEmployeeId
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for updating actions');
    }
    
    return this.employeeService.updateHrRequestAction(id, hrActionDto, hrEmployeeId);
  }

  @Delete('hr-requests/:id')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Delete an HR request', description: 'Allows HR to delete an existing HR request.' })
  @ApiParam({ name: 'id', type: Number, description: 'HR request ID to delete' })
  @ApiQuery({ name: 'hrEmployeeId', type: Number, required: true, description: 'ID of the HR employee performing the deletion' })
  @ApiResponse({ status: 200, description: 'HR request deleted successfully.' })
  async deleteHrRequest(
    @Param('id', ParseIntPipe) id: number,
    @Query('hrEmployeeId', QueryParseIntPipe) hrEmployeeId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    // If admin user, use admin-specific delete handler
    if (req.user.type === 'admin') {
      return this.employeeService.deleteHrRequestAsAdmin(id, req.user.id);
    }
    
    // For HR employees, require hrEmployeeId
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for deleting requests');
    }
    
    return this.employeeService.deleteHrRequest(id, hrEmployeeId);
  }
}
