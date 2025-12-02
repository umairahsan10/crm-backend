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
  Request,
} from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FilterRemindersDto } from './dto/filter-reminders.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@ApiTags('Coomunication Reminders')
@ApiBearerAuth()
@Controller('communication/reminders')
@UseGuards(JwtAuthGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  async createReminder(
    @Body() createReminderDto: CreateReminderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.createReminder(createReminderDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reminders with optional filters' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Pending', 'Completed', 'Overdue'],
  })
  @ApiQuery({ name: 'isRecurring', required: false, type: Boolean })
  @ApiQuery({
    name: 'recurrencePattern',
    required: false,
    enum: ['Daily', 'Weekly', 'Monthly'],
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getReminders(
    @Query() filters: FilterRemindersDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.getReminders(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reminder by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the reminder' })
  async getReminderById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.getReminderById(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update reminder by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the reminder to update',
  })
  async updateReminder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReminderDto: UpdateReminderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.updateReminder(
      id,
      updateReminderDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete reminder by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the reminder to delete',
  })
  async deleteReminder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.deleteReminder(id, req.user.id);
  }
}
