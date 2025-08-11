import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationStatus, UserType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new notification
     * Everyone can create notifications
     */
    async createNotification(createNotificationDto: CreateNotificationDto, currentEmployeeId: number): Promise<NotificationResponseDto[]> {
        // Validate that the current employee exists
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId },
            include: { department: true }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        // Validate recipient exists
        const recipient = await this.prisma.employee.findUnique({
            where: { id: createNotificationDto.sentTo }
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
                    status: createNotificationDto.status || NotificationStatus.unread
                },
                include: {
                    sender: {
                        include: {
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                }
            });

            // Log HR action if HR created the notification
            if (currentEmployee.department.name === 'HR') {
                await this.prisma.hRLog.create({
                    data: {
                        hrId: currentEmployeeId,
                        actionType: 'NOTIFICATION_CREATED',
                        affectedEmployeeId: createNotificationDto.sentTo,
                        description: `HR created notification: "${createNotificationDto.heading}" for employee ${createNotificationDto.sentTo}`
                    }
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
    async getAllNotifications(currentEmployeeId: number): Promise<NotificationResponseDto[]> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId },
            include: { department: true }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        try {
            const notifications = await this.prisma.notification.findMany({
                where: {
                    OR: [
                        { sentTo: currentEmployeeId },
                        { sentBy: currentEmployeeId }
                    ]
                },
                include: {
                    sender: {
                        include: {
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return notifications.map(notification => this.mapToResponseDto(notification));
        } catch (error) {
            throw new BadRequestException(`Failed to fetch notifications: ${error.message}`);
        }
    }

    /**
     * Get notification by ID (employees can only see their own)
     */
    async getNotificationById(id: number, currentEmployeeId: number): Promise<NotificationResponseDto> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId },
            include: { department: true }
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
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                }
            });

            if (!notification) {
                throw new NotFoundException('Notification not found');
            }

            // Check access permissions - only recipient or sender can see
            if (notification.sentTo !== currentEmployeeId && notification.sentBy !== currentEmployeeId) {
                throw new ForbiddenException('Access denied to this notification');
            }

            return this.mapToResponseDto(notification);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(`Failed to fetch notification: ${error.message}`);
        }
    }

    /**
     * Update notification
     * Only notification sender can update
     */
    async updateNotification(id: number, updateNotificationDto: UpdateNotificationDto, currentEmployeeId: number): Promise<NotificationResponseDto> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId },
            include: { department: true }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        // Check if notification exists and current employee has access
        const existingNotification = await this.prisma.notification.findUnique({
            where: { id },
            include: {
                sender: true,
                employee: true
            }
        });

        if (!existingNotification) {
            throw new NotFoundException('Notification not found');
        }

        // Check access permissions - only sender can update
        if (existingNotification.sentBy !== currentEmployeeId) {
            throw new ForbiddenException('Only notification sender can update this notification');
        }

        try {
            const updatedNotification = await this.prisma.notification.update({
                where: { id },
                data: updateNotificationDto,
                include: {
                    sender: {
                        include: {
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                }
            });

            // Log HR action if HR updated the notification
            if (currentEmployee.department.name === 'HR') {
                await this.prisma.hRLog.create({
                    data: {
                        hrId: currentEmployeeId,
                        actionType: 'NOTIFICATION_UPDATED',
                        affectedEmployeeId: existingNotification.sentTo,
                        description: `HR updated notification: "${existingNotification.heading}" to "${updatedNotification.heading || existingNotification.heading}"`
                    }
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
            throw new BadRequestException(`Failed to update notification: ${error.message}`);
        }
    }

    /**
     * Delete notification
     * Only notification sender can delete
     */
    async deleteNotification(id: number, currentEmployeeId: number): Promise<{ message: string }> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId },
            include: { department: true }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        // Check if notification exists and current employee has access
        const existingNotification = await this.prisma.notification.findUnique({
            where: { id }
        });

        if (!existingNotification) {
            throw new NotFoundException('Notification not found');
        }

        // Check access permissions - only sender can delete
        if (existingNotification.sentBy !== currentEmployeeId) {
            throw new ForbiddenException('Only notification sender can delete this notification');
        }

        try {
            await this.prisma.notification.delete({
                where: { id }
            });

            // Log HR action if HR deleted the notification
            if (currentEmployee.department.name === 'HR') {
                await this.prisma.hRLog.create({
                    data: {
                        hrId: currentEmployeeId,
                        actionType: 'NOTIFICATION_DELETED',
                        affectedEmployeeId: existingNotification.sentTo,
                        description: `HR deleted notification: "${existingNotification.heading}"`
                    }
                });
            }

            return { message: 'Notification deleted successfully' };
        } catch (error) {
            throw new BadRequestException(`Failed to delete notification: ${error.message}`);
        }
    }

    /**
     * Get notifications for current employee
     */
    async getMyNotifications(currentEmployeeId: number): Promise<NotificationResponseDto[]> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        try {
            const notifications = await this.prisma.notification.findMany({
                where: {
                    sentTo: currentEmployeeId
                },
                include: {
                    sender: {
                        include: {
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return notifications.map(notification => this.mapToResponseDto(notification));
        } catch (error) {
            throw new BadRequestException(`Failed to fetch notifications: ${error.message}`);
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: number, currentEmployeeId: number): Promise<NotificationResponseDto> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        // Check if notification exists and belongs to current employee
        const existingNotification = await this.prisma.notification.findUnique({
            where: { id }
        });

        if (!existingNotification) {
            throw new NotFoundException('Notification not found');
        }

        if (existingNotification.sentTo !== currentEmployeeId) {
            throw new ForbiddenException('You can only mark your own notifications as read');
        }

        try {
            const updatedNotification = await this.prisma.notification.update({
                where: { id },
                data: { status: NotificationStatus.read },
                include: {
                    sender: {
                        include: {
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                }
            });

            return this.mapToResponseDto(updatedNotification);
        } catch (error) {
            throw new BadRequestException(`Failed to mark notification as read: ${error.message}`);
        }
    }

    /**
     * Get unread notifications count for current employee
     */
    async getUnreadCount(currentEmployeeId: number): Promise<{ count: number }> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        try {
            const count = await this.prisma.notification.count({
                where: {
                    sentTo: currentEmployeeId,
                    status: NotificationStatus.unread
                }
            });

            return { count };
        } catch (error) {
            throw new BadRequestException(`Failed to get unread count: ${error.message}`);
        }
    }

    /**
     * Get notifications by status for current employee
     */
    async getNotificationsByStatus(status: NotificationStatus, currentEmployeeId: number): Promise<NotificationResponseDto[]> {
        const currentEmployee = await this.prisma.employee.findUnique({
            where: { id: currentEmployeeId }
        });

        if (!currentEmployee) {
            throw new NotFoundException('Current employee not found');
        }

        try {
            const notifications = await this.prisma.notification.findMany({
                where: {
                    sentTo: currentEmployeeId,
                    status: status
                },
                include: {
                    sender: {
                        include: {
                            department: true
                        }
                    },
                    employee: {
                        include: {
                            department: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return notifications.map(notification => this.mapToResponseDto(notification));
        } catch (error) {
            throw new BadRequestException(`Failed to fetch notifications by status: ${error.message}`);
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
            status: notification.status,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            sender: notification.sender ? {
                id: notification.sender.id,
                firstName: notification.sender.firstName,
                lastName: notification.sender.lastName,
                email: notification.sender.email,
                department: notification.sender.department ? {
                    id: notification.sender.department.id,
                    name: notification.sender.department.name
                } : undefined
            } : undefined,
            recipient: notification.employee ? {
                id: notification.employee.id,
                firstName: notification.employee.firstName,
                lastName: notification.employee.lastName,
                email: notification.employee.email,
                department: notification.employee.department ? {
                    id: notification.employee.department.id,
                    name: notification.employee.department.name
                } : undefined
            } : undefined
        };
    }
}
