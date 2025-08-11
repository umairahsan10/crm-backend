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
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
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

@Controller('communication/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Create a new notification
   * Everyone can create notifications
   */
  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.createNotification(createNotificationDto, req.user.id);
  }

  /**
   * Get all notifications
   * Admin and HR can only see notifications sent to/received by them
   */
  @Get()
  async getAllNotifications(
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getAllNotifications(req.user.id);
  }

  /**
   * Get notification by ID
   * Employees can only see their own notifications
   */
  @Get(':id')
  async getNotificationById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.getNotificationById(id, req.user.id);
  }

  /**
   * Update notification
   * Only notification sender can update
   */
  @Patch(':id')
  async updateNotification(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.updateNotification(id, updateNotificationDto, req.user.id);
  }

  /**
   * Delete notification
   * Only notification sender can delete
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  /**
   * Get notifications for current employee
   */
  @Get('my/notifications')
  async getMyNotifications(
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getMyNotifications(req.user.id);
  }

  /**
   * Mark notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * Get unread notifications count for current employee
   */
  @Get('unread/count')
  async getUnreadCount(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  /**
   * Get notifications by status for current employee
   */
  @Get('status/:status')
  async getNotificationsByStatus(
    @Param('status') status: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getNotificationsByStatus(status as any, req.user.id);
  }
}
