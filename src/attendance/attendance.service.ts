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
   * Calculate work date based on punch time
   */
  private calculateWorkDate(timestamp: string) {
    const recordTime = new Date(timestamp);
    const workDate = new Date(recordTime);

    // If time is before 4 AM, it belongs to previous day
    if (recordTime.getHours() < 4) {
      workDate.setDate(recordTime.getDate() - 1);
    }

    // Normalize to start of work day (4 AM)
    const recordDate = new Date(
      workDate.getFullYear(),
      workDate.getMonth(),
      workDate.getDate(),
    );

    return { recordTime, workDate, recordDate };
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
  private async getExistingRecord(employeeCode: string, recordDate: Date) {
    try {
      const employee = await this.getEmployee(employeeCode);
      if (!employee) {
        throw new Error(`Employee with ID ${employeeCode} not found`);
      }

      return await this.prisma.attendance_records.findFirst({
        where: {
          employee_id: employee.id,
          date: recordDate,
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
    recordTime: Date,
    recordDate: Date,
  ): Promise<void> {
    try {
      const employee = await this.getEmployee(employeeCode);
      if (!employee) {
        throw new Error(`Employee with ID ${employeeCode} not found`);
      }

      const newRecord = await this.prisma.attendance_records.create({
        data: {
          employee_id: employee.id,
          check_in: recordTime,
          check_out: null,
          date: recordDate,
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
    checkoutTime: Date,
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
    checkinTime: Date,
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
    const { recordTime, recordDate } = this.calculateWorkDate(timestamp);

    // Check for existing record
    const existingRecord = await this.getExistingRecord(
      employeeCode,
      recordDate,
    );

    if (!existingRecord) {
      // First punch of the day = Check-in
      const employee = await this.getEmployee(employeeCode);

      if (!employee) {
        this.logger.warn(
          `❌ Employee with ID ${employeeCode} not found in database`,
        );
        return;
      }

      await this.createNewRecord(employeeCode, recordTime, recordDate);
    } else if (existingRecord.check_in && !existingRecord.check_out) {
      // Second punch = Check-out
      await this.updateCheckoutTime(existingRecord.id, recordTime);
    } else if (existingRecord.check_in && existingRecord.check_out) {
      // Third+ punch = Update check-out time
      await this.updateCheckoutTime(existingRecord.id, recordTime);
    } else {
      // Edge case: record exists but no check-in time
      await this.updateCheckinTime(existingRecord.id, recordTime);
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

  async getDailyAttendance(date: Date) {
    return await this.prisma.attendance_records.findMany({
      where: {
        date: date,
      },
    });
  }

  async getEmployeeRecords(employee_id: string, from: Date, to: Date) {
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

  async getAbsentees(date: Date) {
    return await this.prisma.attendance_records.findMany({
      where: {
        date: date,
        status: attendance_status.absent,
      },
    });
  }

  async getLateComers(date: Date) {
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
    const attendanceRecords = await this.prisma.attendance_records.findMany({
      where: {
        date: yesterday,
      },
    });

    this.logger.log(
      `Found ${attendanceRecords.length} attendance records for ${yesterday.toDateString()}`,
    );
    // TODO: Implement status update logic based on business rules
  }
}
