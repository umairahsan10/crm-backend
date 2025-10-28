import { Injectable, Logger } from '@nestjs/common';

/**
 * Timezone utility service for consistent date/time handling across the application
 * All dates are handled in PKT (Pakistan Standard Time) timezone
 */
@Injectable()
export class TimezoneUtil {
  private readonly logger = new Logger(TimezoneUtil.name);
  private readonly PKT_TIMEZONE = 'Asia/Karachi';

  /**
   * Get current date in PKT timezone
   */
  getCurrentPKTDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: this.PKT_TIMEZONE }));
  }

  /**
   * Get current date string in YYYY-MM-DD format in PKT
   */
  getCurrentPKTDateString(): string {
    const pktDate = this.getCurrentPKTDate();
    return pktDate.toISOString().split('T')[0];
  }

  /**
   * Convert a date string to PKT Date object
   * @param dateString Date string in YYYY-MM-DD format
   * @returns Date object in PKT timezone
   */
  parsePKTDate(dateString: string): Date {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    // Parse date string and ensure it's in PKT timezone
    const date = new Date(dateString + 'T00:00:00+05:00'); // PKT is UTC+5
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD format.`);
    }

    return date;
  }

  /**
   * Convert a date string to PKT Date object for database storage
   * @param dateString Date string in YYYY-MM-DD format
   * @returns Date object normalized to start of day in PKT
   */
  parsePKTDateForDB(dateString: string): Date {
    const date = this.parsePKTDate(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Get date range for a specific month in PKT
   * @param year Year (e.g., 2025)
   * @param month Month (1-12)
   * @returns Object with start and end dates for the month
   */
  getMonthDateRange(year: number, month: number): { start: Date; end: Date } {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of the month
    
    // Ensure dates are in PKT timezone
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Get current month string in YYYY-MM format in PKT
   */
  getCurrentPKTMonthString(): string {
    const pktDate = this.getCurrentPKTDate();
    const year = pktDate.getFullYear();
    const month = String(pktDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Validate if a date string is in correct format and within reasonable range
   * @param dateString Date string to validate
   * @param minDate Optional minimum date
   * @param maxDate Optional maximum date
   * @returns true if valid, throws error if invalid
   */
  validateDateString(dateString: string, minDate?: Date, maxDate?: Date): boolean {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const date = this.parsePKTDate(dateString);
    
    if (minDate && date < minDate) {
      throw new Error(`Date cannot be before ${minDate.toISOString().split('T')[0]}`);
    }
    
    if (maxDate && date > maxDate) {
      throw new Error(`Date cannot be after ${maxDate.toISOString().split('T')[0]}`);
    }

    return true;
  }

  /**
   * Validate date range (start date should not be after end date)
   * @param startDate Start date string
   * @param endDate End date string
   * @returns true if valid, throws error if invalid
   */
  validateDateRange(startDate: string, endDate: string): boolean {
    const start = this.parsePKTDate(startDate);
    const end = this.parsePKTDate(endDate);
    
    if (start > end) {
      throw new Error('Start date cannot be after end date');
    }

    return true;
  }

  /**
   * Get date string in YYYY-MM-DD format from a Date object in PKT
   * @param date Date object
   * @returns Date string in YYYY-MM-DD format
   */
  formatPKTDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if current time is within business hours (9 AM - 6 PM PKT)
   * @returns true if within business hours
   */
  isWithinBusinessHours(): boolean {
    const pktDate = this.getCurrentPKTDate();
    const hour = pktDate.getHours();
    return hour >= 9 && hour < 18;
  }

  /**
   * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) in PKT
   * @param date Optional date, defaults to current PKT date
   * @returns Day of week number
   */
  getDayOfWeek(date?: Date): number {
    const pktDate = date ? new Date(date.toLocaleString('en-US', { timeZone: this.PKT_TIMEZONE })) : this.getCurrentPKTDate();
    return pktDate.getDay();
  }

  /**
   * Check if a date is weekend (Saturday or Sunday) in PKT
   * @param date Optional date, defaults to current PKT date
   * @returns true if weekend
   */
  isWeekend(date?: Date): boolean {
    const dayOfWeek = this.getDayOfWeek(date);
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Get time string in HH:MM format from a Date object in PKT
   * @param date Date object
   * @returns Time string in HH:MM format
   */
  formatPKTTimeToString(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Create a Date object with specific time in PKT timezone
   * @param dateString Date string in YYYY-MM-DD format
   * @param timeString Time string in HH:MM format
   * @returns Date object with specified date and time in PKT
   */
  createPKTDateTime(dateString: string, timeString: string): Date {
    const date = this.parsePKTDate(dateString);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${timeString}. Expected HH:MM format.`);
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Get timezone offset information for logging/debugging
   * @returns Object with timezone information
   */
  getTimezoneInfo(): { timezone: string; offset: string; currentTime: string } {
    const now = new Date();
    const pktTime = new Date(now.toLocaleString('en-US', { timeZone: this.PKT_TIMEZONE }));
    
    return {
      timezone: this.PKT_TIMEZONE,
      offset: '+05:00',
      currentTime: pktTime.toISOString()
    };
  }
}
