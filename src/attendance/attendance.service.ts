import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { attendance_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(readonly prisma: PrismaService) {}

  /**
   * Parse attendance data from request body
   */
  private parseAttendanceData(body: string) {
    const lines = body.trim().split('\n');
    console.log(`Processing ${lines.length} lines`);

    const attendanceRecords: {
      employeeCode: string;
      timestamp: string;
      fields: string[];
    }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const fields = line.split('\t');

      // Skip user data lines
      if (line.startsWith('USER')) continue;

      // Only process lines with sufficient fields (attendance data)
      if (fields.length >= 10) {
        attendanceRecords.push({
          employeeCode: fields[0],
          timestamp: fields[1],
          fields,
        });
      }
    }
    console.log('ATTENDANCE RECORDS', attendanceRecords);

    console.log(`Found ${attendanceRecords.length} attendance records`);
    return attendanceRecords;
  }

  /**
   * Calculate work date based on punch time and extract time-only values
   */
  private calculateWorkDate(timestamp: string) {
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

  /**
   * Get employee information
   */
  private async getEmployee(employeeCode: string) {
    try {
      return await this.prisma.employees.findUnique({
        where: {
          employee_code: employeeCode,
        },
      });
    } catch (error) {
      console.log(`Error finding employee ${employeeCode}`, error);
      throw error;
    }
  }

  /**
   * Get existing attendance record for employee on specific date
   */
  private async getExistingRecord(employeeCode: string, dateString: string) {
    try {
      const employee = await this.getEmployee(employeeCode);
      if (!employee) {
        throw new Error(`Employee with ID ${employeeCode} not found`);
      }

      return await this.prisma.attendance_records.findFirst({
        where: {
          employee_id: employee.id,
          date: dateString,
        },
      });
    } catch (error) {
      console.log(
        `Error finding existing record for employee ${employeeCode}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create new attendance record (check-in)
   */
  private async createNewRecord(
    employeeCode: string,
    timeOnly: string,
    dateString: string,
  ): Promise<void> {
    try {
      const employee = await this.getEmployee(employeeCode);
      if (!employee) {
        throw new Error(`Employee with ID ${employeeCode} not found`);
      }

      const newRecord = await this.prisma.attendance_records.create({
        data: {
          employee_id: employee.id,
          check_in: timeOnly,
          check_out: null,
          date: dateString,
        },
      });
      console.log(
        `✅ Created new record for employee ${employeeCode}`,
        newRecord,
      );
    } catch (error) {
      console.log(
        `❌ Error creating record for employee ${employeeCode}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update existing record with check-out time
   */
  private async updateCheckoutTime(
    recordId: string,
    checkoutTime: string,
  ): Promise<void> {
    try {
      await this.prisma.attendance_records.update({
        where: { id: recordId },
        data: { check_out: checkoutTime },
      });
      console.log(`✅ Updated checkout time for record ${recordId}`);
    } catch (error) {
      console.log(
        `❌ Error updating checkout time for record ${recordId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update existing record with check-in time (edge case)
   */
  private async updateCheckinTime(
    recordId: string,
    checkinTime: string,
  ): Promise<void> {
    try {
      await this.prisma.attendance_records.update({
        where: { id: recordId },
        data: { check_in: checkinTime },
      });
      console.log(`✅ Updated checkin time for record ${recordId}`);
    } catch (error) {
      console.log(
        `❌ Error updating checkin time for record ${recordId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process a single attendance record
   */
  private async processAttendanceRecord(record: {
    employeeCode: string;
    timestamp: string;
    fields: string[];
  }): Promise<void> {
    const { employeeCode, timestamp } = record;
    const { dateString, timeOnly } = this.calculateWorkDate(timestamp);

    // Check for existing record for this work date
    const existingRecord = await this.getExistingRecord(
      employeeCode,
      dateString,
    );

    if (!existingRecord) {
      // No existing record for this work date = Check-in
      const employee = await this.getEmployee(employeeCode);

      if (!employee) {
        this.logger.warn(
          `❌ Employee with ID ${employeeCode} not found in database`,
        );
        return;
      }

      await this.createNewRecord(employeeCode, timeOnly, dateString);
    } else {
      // Record exists for this work date
      if (existingRecord.check_in && !existingRecord.check_out) {
        // Has check-in but no check-out = Check-out
        await this.updateCheckoutTime(existingRecord.id, timeOnly);
      } else if (existingRecord.check_in && existingRecord.check_out) {
        // Has both check-in and check-out = Update check-out time
        await this.updateCheckoutTime(existingRecord.id, timeOnly);
      } else {
        // Edge case: record exists but no check-in time = Update check-in
        await this.updateCheckinTime(existingRecord.id, timeOnly);
      }
    }
  }

  /**
   * Create attendance record (public method for controller)
   */
  async create(attendanceData: string) {
    return this.processAttendance(attendanceData);
  }

  /**
   * Main method to process attendance data
   */
  async processAttendance(
    data: string,
  ): Promise<{ message: string; processed: number }> {
    const attendanceRecords = this.parseAttendanceData(data);

    let processedCount = 0;
    const errors: string[] = [];

    // Process each attendance record
    for (const record of attendanceRecords) {
      try {
        await this.processAttendanceRecord(record);
        processedCount++;
      } catch (error) {
        const errorMessage = `Error processing record for employee ${record.employeeCode}: ${error.message}`;
        this.logger.error(errorMessage, error);
        errors.push(errorMessage);
        // Continue processing other records even if one fails
      }
    }

    this.logger.log(
      `Processed ${processedCount}/${attendanceRecords.length} attendance records`,
    );

    if (errors.length > 0) {
      this.logger.warn(`Encountered ${errors.length} errors during processing`);
    }

    return {
      message: `Successfully processed ${processedCount}/${attendanceRecords.length} records`,
      processed: processedCount,
    };
  }

  async getDailyAttendance(date: string) {
    return await this.prisma.attendance_records.findMany({
      where: {
        date: date,
      },
    });
  }

  async getEmployeeRecords(employee_id: string, from: string, to: string) {
    return await this.prisma.attendance_records.findMany({
      where: {
        employee_id: employee_id,
        date: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  async getAbsentees(date: string) {
    return await this.prisma.attendance_records.findMany({
      where: {
        date: date,
        status: attendance_status.absent,
      },
    });
  }

  async getLateComers(date: string) {
    return await this.prisma.attendance_records.findMany({
      where: {
        date: date,
        status: attendance_status.late,
      },
    });
  }

  // Cron job to update attendance status (present, absent)
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async updateAttendanceStatus() {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
    const yesterdayString = yesterday.toISOString().split('T')[0];

    const attendanceRecords = await this.prisma.attendance_records.findMany({
      where: {
        date: yesterdayString,
      },
    });

    this.logger.log(
      `Found ${attendanceRecords.length} attendance records for ${yesterdayString}`,
    );
    // TODO: Implement status update logic based on business rules
  }
}
