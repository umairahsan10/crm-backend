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
  ParseIntPipe as QueryParseIntPipe
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateHrRequestDto } from './dto/create-hr-request.dto';
import { HrActionDto } from './dto/hr-action.dto';
import { RequestPriority, RequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Departments } from '../../../common/decorators/departments.decorator';

@Controller('communication/employee')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('hr-requests')
  @Departments('HR', 'Admin')
  async getAllHrRequests() {
    return this.employeeService.getAllHrRequests();
  }

  @Get('hr-requests/my-requests')
  @Departments('HR', 'Admin', 'Development', 'Marketing', 'Sales', 'Production')
  async getMyHrRequests(@Query('employeeId', QueryParseIntPipe) employeeId: number) {
    return this.employeeService.getHrRequestsByEmployee(employeeId);
  }

  @Get('hr-requests/:id')
  @Departments('HR', 'Admin')
  async getHrRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.getHrRequestById(id);
  }

  @Get('hr-requests/priority/:priority')
  @Departments('HR', 'Admin')
  async getHrRequestsByPriority(@Param('priority') priority: RequestPriority) {
    return this.employeeService.getHrRequestsByPriority(priority);
  }

  @Get('hr-requests/status/:status')
  @Departments('HR')
  async getHrRequestsByStatus(@Param('status') status: RequestStatus) {
    return this.employeeService.getHrRequestsByStatus(status);
  }

  @Post('hr-requests')
  @HttpCode(HttpStatus.CREATED)
  @Departments('HR', 'Admin', 'Development', 'Marketing', 'Sales', 'Production')
  async createHrRequest(@Body() createHrRequestDto: CreateHrRequestDto) {
    return this.employeeService.createHrRequest(createHrRequestDto);
  }



  @Post('hr-requests/:id/action')
  @HttpCode(HttpStatus.OK)
  @Departments('HR')
  async takeHrAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() hrActionDto: HrActionDto,
    @Query('hrEmployeeId', QueryParseIntPipe) hrEmployeeId: number,
  ) {
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for taking actions');
    }
    
    return this.employeeService.takeHrAction(id, hrActionDto, hrEmployeeId);
  }

  @Put('hr-requests/:id/action')
  @Departments('HR')
  async updateHrRequestAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() hrActionDto: HrActionDto,
    @Query('hrEmployeeId', QueryParseIntPipe) hrEmployeeId: number,
  ) {
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for updating actions');
    }
    
    return this.employeeService.updateHrRequestAction(id, hrActionDto, hrEmployeeId);
  }

  @Delete('hr-requests/:id')
  @Departments('HR')
  async deleteHrRequest(
    @Param('id', ParseIntPipe) id: number,
    @Query('hrEmployeeId', QueryParseIntPipe) hrEmployeeId: number,
  ) {
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for deleting requests');
    }
    
    return this.employeeService.deleteHrRequest(id, hrEmployeeId);
  }
}
