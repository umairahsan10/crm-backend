/**
 * Time Storage Utility
 * 
 * This utility provides consistent time storage across the application,
 * ensuring that times are stored exactly as entered without timezone conversion.
 * This matches the behavior of the attendance system.
 */

export class TimeStorageUtil {
  /**
   * Creates a date for storage using the same method as attendance service
   * This ensures the time is stored as entered without timezone conversion
   */
  static createTimeForStorage(date: Date): Date {
    // Extract time components from the current date
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // Create a new date with the same date but set UTC time directly
    // This ensures the time is stored as entered without timezone conversion
    const storageDate = new Date(date);
    storageDate.setUTCHours(hours, minutes, seconds, 0);
    
    return storageDate;
  }

  /**
   * Creates a date for storage from a date string and time string
   * Used for parsing input times (like checkin/checkout)
   */
  static createTimeForStorageFromStrings(dateString: string, timeString: string): Date {
    try {
      // Extract time components directly from the ISO string
      const timeMatch = timeString.match(/T(\d{2}):(\d{2}):(\d{2})/);

      if (!timeMatch) {
        throw new Error('Invalid time format - could not extract time from: ' + timeString);
      }

      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3], 10);

      // Create the date
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format: ' + dateString);
      }

      // Set UTC time directly to ensure it stores as entered time
      const storageDate = new Date(date);
      storageDate.setUTCHours(hours, minutes, seconds, 0);

      if (isNaN(storageDate.getTime())) {
        throw new Error('Invalid time values for storage: ' + hours + ':' + minutes + ':' + seconds);
      }

      return storageDate;
    } catch (error) {
      console.error('Error in createTimeForStorageFromStrings:', error);
      throw new Error('Failed to parse time for storage: ' + error.message);
    }
  }

  /**
   * Gets current time for storage
   */
  static getCurrentTimeForStorage(): Date {
    return this.createTimeForStorage(new Date());
  }

  /**
   * Creates a date for storage from time components
   */
  static createTimeForStorageFromComponents(
    year: number, 
    month: number, 
    day: number, 
    hours: number, 
    minutes: number, 
    seconds: number = 0
  ): Date {
    const date = new Date(year, month, day);
    const storageDate = new Date(date);
    storageDate.setUTCHours(hours, minutes, seconds, 0);
    return storageDate;
  }

  /**
   * Gets current time in PKT (Pakistan Time - UTC+5) for storage
   */
  static getCurrentPKTTimeForStorage(): Date {
    const now = new Date();
    
    // Convert to PKT (UTC+5)
    // Get UTC time in milliseconds and add 5 hours (5 * 60 * 60 * 1000)
    const pktTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
    
    // Extract PKT time components
    const hours = pktTime.getUTCHours();
    const minutes = pktTime.getUTCMinutes();
    const seconds = pktTime.getUTCSeconds();
    const date = pktTime.getUTCDate();
    const month = pktTime.getUTCMonth();
    const year = pktTime.getUTCFullYear();
    
    // Create a new date with PKT time stored in UTC format
    const storageDate = new Date(Date.UTC(year, month, date, hours, minutes, seconds, 0));
    
    return storageDate;
  }
}
