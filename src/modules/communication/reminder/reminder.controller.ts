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

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@Controller('communication/reminders')
@UseGuards(JwtAuthGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReminder(
    @Body() createReminderDto: CreateReminderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.createReminder(createReminderDto, req.user.id);
  }

  @Get()
  async getReminders(
    @Query() filters: FilterRemindersDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.getReminders(req.user.id, filters);
  }

  @Get(':id')
  async getReminderById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.getReminderById(id, req.user.id);
  }

  @Put(':id')
  async updateReminder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReminderDto: UpdateReminderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.updateReminder(id, updateReminderDto, req.user.id);
  }

  @Delete(':id')
  async deleteReminder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reminderService.deleteReminder(id, req.user.id);
  }
}
