import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WorkDateCalculator {
  private readonly logger = new Logger(WorkDateCalculator.name);

  /**
   * Calculate work date based on punch time and extract time-only values
   */
  calculateWorkDate(timestamp: string) {
    // Parse the timestamp as local time (no timezone conversion)
    const recordTime = new Date(timestamp);
    const workDate = new Date(recordTime);

    // If time is 4 AM or before, it belongs to previous day
    // Note: 4:00 AM and before belongs to previous day, after 4:00 AM belongs to current day
    if (recordTime.getHours() <= 4) {
      workDate.setDate(recordTime.getDate() - 1);
    }

    // Create date string directly from workDate to avoid timezone conversion issues
    const year = workDate.getFullYear();
    const month = String(workDate.getMonth() + 1).padStart(2, '0');
    const day = String(workDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Create a proper Date object for the date (at midnight local time)
    const recordDate = new Date(
      year,
      workDate.getMonth(),
      workDate.getDate(),
      0,
      0,
      0,
      0,
    );

    // Extract time-only string directly from the original timestamp (HH:MM:SS format)
    const timeOnly = recordTime.toTimeString().split(' ')[0]; // Gets HH:MM:SS

    return { recordTime, workDate, recordDate, timeOnly, dateString };
  }
}
