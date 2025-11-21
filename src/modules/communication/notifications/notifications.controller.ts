import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateBulkNotificationDto } from './dto/create-bulk-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
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

@ApiTags('Communication Notifications')
@ApiBearerAuth()
@Controller('communication/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, type: [NotificationResponseDto], description: 'Notification(s) created successfully' })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.createNotification(createNotificationDto, req.user.id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create a bulk notification to all employees or a specific department' })
  @ApiResponse({ status: 201, description: 'Bulk notifications created successfully' })
  async createBulkNotification(
    @Body() createBulkNotificationDto: CreateBulkNotificationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string; recipientCount: number }> {
    return this.notificationsService.createBulkNotification(createBulkNotificationDto, req.user.id);
  }

  @Get('bulk')
  @ApiOperation({ summary: 'Get summary of all bulk notifications sent' })
  @ApiQuery({ name: 'departmentId', required: false, description: 'Filter by department ID' })
  @ApiQuery({
    name: 'notificationType',
    required: false,
    enum: ['bulk_all', 'bulk_department'],
    description: 'Filter by bulk notification type',
  })
  @ApiResponse({ status: 200, description: 'List of bulk notification summaries' })
  async getBulkNotificationSummary(
    @Request() req: AuthenticatedRequest,
    @Query('departmentId') departmentId?: string,
    @Query('notificationType') notificationType?: 'bulk_all' | 'bulk_department',
  ): Promise<any[]> {
    const filters = {
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      notificationType,
    };
    return this.notificationsService.getBulkNotificationSummary(req.user.id, filters);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto], description: 'List of all notifications' })
  async getAllNotifications(
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getAllNotifications(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async getNotificationById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.getNotificationById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: NotificationResponseDto, description: 'Updated notification details' })
  async updateNotification(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.updateNotification(id, updateNotificationDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  @Get('my/notifications')
  @ApiOperation({ summary: 'Get notifications for the current employee' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async getMyNotifications(
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getMyNotifications(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notifications count for the current employee' })
  @ApiResponse({ status: 200, description: 'Unread notification count', schema: { example: { count: 3 } } })
  async getUnreadCount(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get notifications by status for the current employee' })
  @ApiParam({ name: 'status', description: 'Notification status (e.g. READ, UNREAD)' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async getNotificationsByStatus(
    @Param('status') status: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getNotificationsByStatus(status as any, req.user.id);
  }
}
