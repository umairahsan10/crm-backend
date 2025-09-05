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
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { HrActionDto } from './dto/hr-action.dto';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { Departments } from '../../../common/decorators/departments.decorator';

@Controller('communication/complaints')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @Departments('HR', 'Admin')
  async getAllComplaints() {
    return this.complaintsService.getAllComplaints();
  }

  @Get(':id')
  @Departments('HR', 'Admin')
  async getComplaintById(@Param('id', ParseIntPipe) id: number) {
    return this.complaintsService.getComplaintById(id);
  }

  @Get('priority/:priority')
  @Departments('HR', 'Admin')
  async getComplaintsByPriority(@Param('priority') priority: ComplaintPriority) {
    return this.complaintsService.getComplaintsByPriority(priority);
  }

  @Get('status/:status')
  @Departments('HR', 'Admin')
  async getComplaintsByStatus(@Param('status') status: ComplaintStatus) {
    return this.complaintsService.getComplaintsByStatus(status);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Departments('HR', 'Admin', 'Development', 'Marketing', 'Sales', 'Production')
  async createComplaint(@Body() createComplaintDto: CreateComplaintDto) {
    return this.complaintsService.createComplaint(createComplaintDto);
  }

  @Put(':id/action')
  @Departments('HR')
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
