import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FilterRemindersDto } from './dto/filter-reminders.dto';
import { RecurrencePattern, ReminderStatus } from '@prisma/client';
import { TimeStorageUtil } from '../../../common/utils/time-storage.util';

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new reminder for the authenticated user
   */
  async createReminder(createReminderDto: CreateReminderDto, empId: number) {
    try {
      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Validate time format (HH:MM)
      if (!this.isValidTimeFormat(createReminderDto.reminderTime)) {
        throw new BadRequestException('Reminder time must be in HH:MM format');
      }

      // Validate recurrence pattern is provided if recurring
      if (
        createReminderDto.isRecurring &&
        !createReminderDto.recurrencePattern
      ) {
        throw new BadRequestException(
          'Recurrence pattern is required when creating a recurring reminder',
        );
      }

      // Validate recurrence pattern is not provided if not recurring
      if (
        !createReminderDto.isRecurring &&
        createReminderDto.recurrencePattern
      ) {
        throw new BadRequestException(
          'Recurrence pattern should not be provided for non-recurring reminders',
        );
      }

      const reminder = await this.prisma.reminders.create({
        data: {
          empId,
          title: createReminderDto.title,
          description: createReminderDto.description,
          reminderDate: TimeStorageUtil.createTimeForStorageFromStrings(
            createReminderDto.reminderDate,
            '00:00:00',
          ),
          reminderTime: createReminderDto.reminderTime,
          isRecurring: createReminderDto.isRecurring,
          recurrencePattern: createReminderDto.recurrencePattern,
          status: ReminderStatus.Pending,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Reminder created successfully',
        data: reminder,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error creating reminder:', error);
      throw new InternalServerErrorException('Failed to create reminder');
    }
  }

  /**
   * Get reminders for the authenticated user with optional filters
   */
  async getReminders(empId: number, filters?: FilterRemindersDto) {
    try {
      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
        select: { id: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const whereClause: any = {
        empId,
      };

      // Apply filters
      if (filters) {
        if (filters.status) {
          whereClause.status = filters.status;
        }

        if (filters.isRecurring !== undefined) {
          whereClause.isRecurring = filters.isRecurring;
        }

        if (filters.recurrencePattern) {
          whereClause.recurrencePattern = filters.recurrencePattern;
        }

        if (filters.dateFrom && filters.dateTo) {
          whereClause.reminderDate = {
            gte: new Date(filters.dateFrom),
            lte: new Date(filters.dateTo),
          };
        } else if (filters.dateFrom) {
          whereClause.reminderDate = {
            gte: new Date(filters.dateFrom),
          };
        } else if (filters.dateTo) {
          whereClause.reminderDate = {
            lte: new Date(filters.dateTo),
          };
        }
      }

      const reminders = await this.prisma.reminders.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ reminderDate: 'asc' }, { reminderTime: 'asc' }],
      });

      return {
        success: true,
        message: 'Reminders retrieved successfully',
        data: reminders,
        count: reminders.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching reminders:', error);
      throw new InternalServerErrorException('Failed to fetch reminders');
    }
  }

  /**
   * Get a specific reminder by ID (only if it belongs to the authenticated user)
   */
  async getReminderById(id: number, empId: number) {
    try {
      const reminder = await this.prisma.reminders.findFirst({
        where: {
          id,
          empId, // Ensure the reminder belongs to the authenticated user
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!reminder) {
        throw new NotFoundException(
          'Reminder not found or you do not have permission to access it',
        );
      }

      return {
        success: true,
        message: 'Reminder retrieved successfully',
        data: reminder,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching reminder by ID:', error);
      throw new InternalServerErrorException('Failed to fetch reminder');
    }
  }

  /**
   * Update a reminder (only if it belongs to the authenticated user)
   */
  async updateReminder(
    id: number,
    updateReminderDto: UpdateReminderDto,
    empId: number,
  ) {
    try {
      // Check if reminder exists and belongs to the user
      const existingReminder = await this.prisma.reminders.findFirst({
        where: {
          id,
          empId, // Ensure the reminder belongs to the authenticated user
        },
      });

      if (!existingReminder) {
        throw new NotFoundException(
          'Reminder not found or you do not have permission to update it',
        );
      }

      // Validate time format if provided
      if (
        updateReminderDto.reminderTime &&
        !this.isValidTimeFormat(updateReminderDto.reminderTime)
      ) {
        throw new BadRequestException('Reminder time must be in HH:MM format');
      }

      // Validate recurrence pattern logic
      const isRecurring =
        updateReminderDto.isRecurring !== undefined
          ? updateReminderDto.isRecurring
          : existingReminder.isRecurring;

      if (
        isRecurring &&
        updateReminderDto.isRecurring !== false &&
        !updateReminderDto.recurrencePattern &&
        !existingReminder.recurrencePattern
      ) {
        throw new BadRequestException(
          'Recurrence pattern is required for recurring reminders',
        );
      }

      if (!isRecurring && updateReminderDto.recurrencePattern) {
        throw new BadRequestException(
          'Recurrence pattern should not be provided for non-recurring reminders',
        );
      }

      const updateData: any = {};

      if (updateReminderDto.title !== undefined)
        updateData.title = updateReminderDto.title;
      if (updateReminderDto.description !== undefined)
        updateData.description = updateReminderDto.description;
      if (updateReminderDto.reminderDate !== undefined)
        updateData.reminderDate =
          TimeStorageUtil.createTimeForStorageFromStrings(
            updateReminderDto.reminderDate,
            '00:00:00',
          );
      if (updateReminderDto.reminderTime !== undefined)
        updateData.reminderTime = updateReminderDto.reminderTime;
      if (updateReminderDto.isRecurring !== undefined)
        updateData.isRecurring = updateReminderDto.isRecurring;
      if (updateReminderDto.recurrencePattern !== undefined)
        updateData.recurrencePattern = updateReminderDto.recurrencePattern;
      if (updateReminderDto.status !== undefined)
        updateData.status = updateReminderDto.status;

      // If setting to non-recurring, remove recurrence pattern
      if (updateReminderDto.isRecurring === false) {
        updateData.recurrencePattern = null;
      }

      const updatedReminder = await this.prisma.reminders.update({
        where: { id },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Reminder updated successfully',
        data: updatedReminder,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating reminder:', error);
      throw new InternalServerErrorException('Failed to update reminder');
    }
  }

  /**
   * Delete a reminder (only if it belongs to the authenticated user)
   */
  async deleteReminder(id: number, empId: number) {
    try {
      // Check if reminder exists and belongs to the user
      const existingReminder = await this.prisma.reminders.findFirst({
        where: {
          id,
          empId, // Ensure the reminder belongs to the authenticated user
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!existingReminder) {
        throw new NotFoundException(
          'Reminder not found or you do not have permission to delete it',
        );
      }

      await this.prisma.reminders.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Reminder deleted successfully',
        data: existingReminder,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting reminder:', error);
      throw new InternalServerErrorException('Failed to delete reminder');
    }
  }

  /**
   * Helper method to validate time format (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
