import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { HrActionDto } from './dto/hr-action.dto';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Departments } from '../../../common/decorators/departments.decorator';

@ApiTags('Communication Complaints')
@ApiBearerAuth()
@Controller('communication/complaints')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Retrieve all complaints' })
  @ApiResponse({ status: 200, description: 'List of all complaints retrieved successfully' })
  async getAllComplaints() {
    return this.complaintsService.getAllComplaints();
  }

  @Get(':id')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Retrieve complaint details by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Complaint ID' })
  @ApiResponse({ status: 200, description: 'Complaint retrieved successfully' })
  async getComplaintById(@Param('id', ParseIntPipe) id: number) {
    return this.complaintsService.getComplaintById(id);
  }

  @Get('priority/:priority')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Filter complaints by priority' })
  @ApiParam({ name: 'priority', enum: ComplaintPriority, description: 'Complaint priority level' })
  @ApiResponse({ status: 200, description: 'Complaints filtered by priority retrieved successfully' })
  async getComplaintsByPriority(@Param('priority') priority: ComplaintPriority) {
    return this.complaintsService.getComplaintsByPriority(priority);
  }

  @Get('status/:status')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Filter complaints by status' })
  @ApiParam({ name: 'status', enum: ComplaintStatus, description: 'Complaint status' })
  @ApiResponse({ status: 200, description: 'Complaints filtered by status retrieved successfully' })
  async getComplaintsByStatus(@Param('status') status: ComplaintStatus) {
    return this.complaintsService.getComplaintsByStatus(status);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Departments('HR', 'Admin', 'Development', 'Marketing', 'Sales', 'Production')
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiResponse({ status: 201, description: 'Complaint created successfully' })
  async createComplaint(@Body() createComplaintDto: CreateComplaintDto) {
    return this.complaintsService.createComplaint(createComplaintDto);
  }

  @Put(':id/action')
  @Departments('HR')
  @ApiOperation({ summary: 'Update complaint with HR action (assign, change status, add notes, etc.)' })
  @ApiParam({ name: 'id', type: Number, description: 'Complaint ID' })
  @ApiQuery({ name: 'hrEmployeeId', type: Number, required: true, description: 'HR employee ID taking action' })
  @ApiResponse({ status: 200, description: 'Complaint action updated successfully' })
  async updateComplaintAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() hrActionDto: HrActionDto,
    @Query('hrEmployeeId', ParseIntPipe) hrEmployeeId: number,
  ) {
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for taking actions');
    }

    return this.complaintsService.updateComplaintAction(id, hrActionDto, hrEmployeeId);
  }

  @Delete(':id')
  @Departments('HR', 'Admin')
  @ApiOperation({ summary: 'Delete complaint by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Complaint ID' })
  @ApiQuery({ name: 'hrEmployeeId', type: Number, required: true, description: 'HR employee ID performing the deletion' })
  @ApiResponse({ status: 200, description: 'Complaint deleted successfully' })
  async deleteComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Query('hrEmployeeId', ParseIntPipe) hrEmployeeId: number,
  ) {
    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required for deleting complaints');
    }

    return this.complaintsService.deleteComplaint(id, hrEmployeeId);
  }
}
