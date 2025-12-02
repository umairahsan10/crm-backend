import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationStatus, UserType, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notification
   * Everyone can create notifications
   */
  async createNotification(
    createNotificationDto: CreateNotificationDto,
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto[]> {
    // Validate that the current employee exists
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Validate recipient exists
    const recipient = await this.prisma.employee.findUnique({
      where: { id: createNotificationDto.sentTo },
    });

    if (!recipient) {
      throw new BadRequestException('Recipient employee not found');
    }

    try {
      // Create notification
      const notification = await this.prisma.notification.create({
        data: {
          heading: createNotificationDto.heading,
          content: createNotificationDto.content,
          sentTo: createNotificationDto.sentTo,
          sentBy: createNotificationDto.sentBy || currentEmployeeId,
          userType: createNotificationDto.userType,
          notificationType:
            createNotificationDto.notificationType || 'individual',
          targetDepartmentId: createNotificationDto.targetDepartmentId || null,
          status: createNotificationDto.status || NotificationStatus.unread,
        },
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
      });

      // Log HR action if HR created the notification
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'NOTIFICATION_CREATED',
            affectedEmployeeId: createNotificationDto.sentTo,
            description: `HR created notification: "${createNotificationDto.heading}" for employee ${createNotificationDto.sentTo}`,
          },
        });
      }

      return [this.mapToResponseDto(notification)];
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate notification entry found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed');
      }
      throw error;
    }
  }

  /**
   * Get all notifications (Everyone can only see their own)
   */
  async getAllNotifications(
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto[]> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          OR: [{ sentTo: currentEmployeeId }, { sentBy: currentEmployeeId }],
        },
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications.map((notification) =>
        this.mapToResponseDto(notification),
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch notifications: ${error.message}`,
      );
    }
  }

  /**
   * Get notification by ID (employees can only see their own)
   */
  async getNotificationById(
    id: number,
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      // Check access permissions - only recipient or sender can see
      if (
        notification.sentTo !== currentEmployeeId &&
        notification.sentBy !== currentEmployeeId
      ) {
        throw new ForbiddenException('Access denied to this notification');
      }

      return this.mapToResponseDto(notification);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch notification: ${error.message}`,
      );
    }
  }

  /**
   * Update notification
   * Only notification sender can update
   */
  async updateNotification(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if notification exists and current employee has access
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        sender: true,
        employee: true,
      },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access permissions - only sender can update
    if (existingNotification.sentBy !== currentEmployeeId) {
      throw new ForbiddenException(
        'Only notification sender can update this notification',
      );
    }

    try {
      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: updateNotificationDto,
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
      });

      // Log HR action if HR updated the notification
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'NOTIFICATION_UPDATED',
            affectedEmployeeId: existingNotification.sentTo,
            description: `HR updated notification: "${existingNotification.heading}" to "${updatedNotification.heading || existingNotification.heading}"`,
          },
        });
      }

      return this.mapToResponseDto(updatedNotification);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate notification entry found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed');
      }
      throw new BadRequestException(
        `Failed to update notification: ${error.message}`,
      );
    }
  }

  /**
   * Delete notification
   * Only notification sender can delete
   */
  async deleteNotification(
    id: number,
    currentEmployeeId: number,
  ): Promise<{ message: string }> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if notification exists and current employee has access
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access permissions - only sender can delete
    if (existingNotification.sentBy !== currentEmployeeId) {
      throw new ForbiddenException(
        'Only notification sender can delete this notification',
      );
    }

    try {
      await this.prisma.notification.delete({
        where: { id },
      });

      // Log HR action if HR deleted the notification
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'NOTIFICATION_DELETED',
            affectedEmployeeId: existingNotification.sentTo,
            description: `HR deleted notification: "${existingNotification.heading}"`,
          },
        });
      }

      return { message: 'Notification deleted successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete notification: ${error.message}`,
      );
    }
  }

  /**
   * Get notifications for current employee
   */
  async getMyNotifications(
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto[]> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          sentTo: currentEmployeeId,
        },
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications.map((notification) =>
        this.mapToResponseDto(notification),
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch notifications: ${error.message}`,
      );
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    id: number,
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if notification exists and belongs to current employee
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    if (existingNotification.sentTo !== currentEmployeeId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }

    try {
      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.read },
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
      });

      return this.mapToResponseDto(updatedNotification);
    } catch (error) {
      throw new BadRequestException(
        `Failed to mark notification as read: ${error.message}`,
      );
    }
  }

  /**
   * Get unread notifications count for current employee
   */
  async getUnreadCount(currentEmployeeId: number): Promise<{ count: number }> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const count = await this.prisma.notification.count({
        where: {
          sentTo: currentEmployeeId,
          status: NotificationStatus.unread,
        },
      });

      return { count };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get unread count: ${error.message}`,
      );
    }
  }

  /**
   * Get notifications by status for current employee
   */
  async getNotificationsByStatus(
    status: NotificationStatus,
    currentEmployeeId: number,
  ): Promise<NotificationResponseDto[]> {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          sentTo: currentEmployeeId,
          status: status,
        },
        include: {
          sender: {
            include: {
              department: true,
            },
          },
          employee: {
            include: {
              department: true,
            },
          },
          targetDepartment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications.map((notification) =>
        this.mapToResponseDto(notification),
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch notifications by status: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to map database result to response DTO
   */
  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      heading: notification.heading,
      content: notification.content,
      sentTo: notification.sentTo,
      sentBy: notification.sentBy,
      userType: notification.userType,
      notificationType: notification.notificationType,
      targetDepartmentId: notification.targetDepartmentId,
      status: notification.status,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      sender: notification.sender
        ? {
            id: notification.sender.id,
            firstName: notification.sender.firstName,
            lastName: notification.sender.lastName,
            email: notification.sender.email,
            department: notification.sender.department
              ? {
                  id: notification.sender.department.id,
                  name: notification.sender.department.name,
                }
              : undefined,
          }
        : undefined,
      recipient: notification.employee
        ? {
            id: notification.employee.id,
            firstName: notification.employee.firstName,
            lastName: notification.employee.lastName,
            email: notification.employee.email,
            department: notification.employee.department
              ? {
                  id: notification.employee.department.id,
                  name: notification.employee.department.name,
                }
              : undefined,
          }
        : undefined,
      targetDepartment: notification.targetDepartment
        ? {
            id: notification.targetDepartment.id,
            name: notification.targetDepartment.name,
          }
        : undefined,
    };
  }

  /**
   * Create bulk notification to all employees
   * Only HR/Admin can create bulk notifications
   */
  async createBulkNotification(
    createBulkNotificationDto: any,
    currentEmployeeId: number,
  ): Promise<{ message: string; recipientCount: number }> {
    // Validate that the current employee exists and is HR/Admin
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true, role: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if user has permission to send bulk notifications
    if (
      currentEmployee.department.name !== 'HR' &&
      currentEmployee.role.name !== 'dep_manager'
    ) {
      throw new ForbiddenException(
        'Only HR Department Managers can send bulk notifications',
      );
    }

    // Validate notification type
    if (
      createBulkNotificationDto.notificationType !== 'bulk_all' &&
      createBulkNotificationDto.notificationType !== 'bulk_department'
    ) {
      throw new BadRequestException(
        'Invalid notification type for bulk notifications',
      );
    }

    // For department-specific notifications, validate department exists
    if (
      createBulkNotificationDto.notificationType === 'bulk_department' &&
      !createBulkNotificationDto.targetDepartmentId
    ) {
      throw new BadRequestException(
        'Department ID is required for department-specific bulk notifications',
      );
    }

    if (createBulkNotificationDto.notificationType === 'bulk_department') {
      const department = await this.prisma.department.findUnique({
        where: { id: createBulkNotificationDto.targetDepartmentId },
      });
      if (!department) {
        throw new BadRequestException('Target department not found');
      }
    }

    try {
      let targetEmployees: any[];

      if (createBulkNotificationDto.notificationType === 'bulk_all') {
        // Get all active employees
        targetEmployees = await this.prisma.employee.findMany({
          where: { status: 'active' },
        });
      } else {
        // Get employees from specific department
        targetEmployees = await this.prisma.employee.findMany({
          where: {
            departmentId: createBulkNotificationDto.targetDepartmentId,
            status: 'active',
          },
        });
      }

      if (targetEmployees.length === 0) {
        throw new BadRequestException(
          'No active employees found for the specified criteria',
        );
      }

      // Create notifications for all target employees
      await this.prisma.$transaction(async (tx) => {
        for (const employee of targetEmployees) {
          await tx.notification.create({
            data: {
              heading: createBulkNotificationDto.heading,
              content: createBulkNotificationDto.content,
              sentTo: employee.id,
              sentBy: createBulkNotificationDto.sentBy || currentEmployeeId,
              userType: createBulkNotificationDto.userType,
              notificationType: createBulkNotificationDto.notificationType,
              targetDepartmentId:
                createBulkNotificationDto.targetDepartmentId || null,
              status:
                createBulkNotificationDto.status || NotificationStatus.unread,
            },
          });
        }
      });

      // Log HR action
      if (currentEmployee.department.name === 'HR') {
        await this.prisma.hRLog.create({
          data: {
            hrId: currentEmployeeId,
            actionType: 'BULK_NOTIFICATION_CREATED',
            affectedEmployeeId: null,
            description: `HR created bulk notification: "${createBulkNotificationDto.heading}" for ${targetEmployees.length} employees`,
          },
        });
      }

      return {
        message: `Bulk notification sent successfully to ${targetEmployees.length} employees`,
        recipientCount: targetEmployees.length,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate notification entry found');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed');
      }
      throw error;
    }
  }

  /**
   * Get summary of all bulk notifications sent
   * Only HR/Admin can access this
   */
  async getBulkNotificationSummary(
    currentEmployeeId: number,
    filters?: {
      departmentId?: number;
      notificationType?: 'bulk_all' | 'bulk_department';
    },
  ): Promise<any[]> {
    // Validate that the current employee exists and is HR/Admin
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true, role: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Current employee not found');
    }

    // Check if user has permission to view bulk notification summary
    if (
      currentEmployee.department.name !== 'HR' &&
      currentEmployee.role.name !== 'dep_manager'
    ) {
      throw new ForbiddenException(
        'Only HR Department Managers and admin can view bulk notification summary',
      );
    }

    try {
      // Get bulk notifications grouped by content and type
      const bulkNotifications = await this.prisma.notification.groupBy({
        by: [
          'heading',
          'content',
          'notificationType',
          'targetDepartmentId',
          'createdAt',
          'sentBy',
        ],
        where: {
          notificationType: { in: ['bulk_all', 'bulk_department'] },
          ...(filters?.departmentId && {
            targetDepartmentId: filters.departmentId,
          }),
          ...(filters?.notificationType && {
            notificationType: filters.notificationType,
          }),
        },
        _count: { id: true },
        orderBy: { createdAt: 'desc' },
      });

      // Enhance with additional information
      const enhancedBulkNotifications = await Promise.all(
        bulkNotifications.map(async (bulk) => {
          // Get sender information
          const sender = await this.prisma.employee.findUnique({
            where: { id: bulk.sentBy! },
            include: { department: true },
          });

          // Get department information if applicable
          let departmentName: string | null = null;
          if (bulk.targetDepartmentId) {
            const department = await this.prisma.department.findUnique({
              where: { id: bulk.targetDepartmentId },
            });
            departmentName = department?.name || null;
          }

          return {
            heading: bulk.heading,
            content: bulk.content,
            notificationType: bulk.notificationType,
            targetDepartmentId: bulk.targetDepartmentId,
            targetDepartmentName: departmentName,
            sentAt: bulk.createdAt,
            recipientCount: bulk._count.id,
            sentBy: bulk.sentBy,
            senderName: sender
              ? `${sender.firstName} ${sender.lastName}`
              : 'Unknown',
            senderDepartment: (sender as any)?.department?.name || 'Unknown',
          };
        }),
      );

      return enhancedBulkNotifications;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch bulk notification summary: ${error.message}`,
      );
    }
  }
}
