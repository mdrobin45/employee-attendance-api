import { Injectable, Logger } from '@nestjs/common';
import { AttendanceDataParser } from './attendance-data-parser';
import { AttendanceRecordHandler } from './attendance-record-handler';
import { WorkDateCalculator } from './work-date-calculator';

@Injectable()
export class AttendanceProcessor {
  private readonly logger = new Logger(AttendanceProcessor.name);

  constructor(
    private readonly dataParser: AttendanceDataParser,
    private readonly dateCalculator: WorkDateCalculator,
    private readonly recordHandler: AttendanceRecordHandler,
  ) {}

  /**
   * Process a single attendance record
   */
  async processAttendanceRecord(record: {
    employeeCode: string;
    timestamp: string;
    fields: string[];
  }): Promise<void> {
    const { employeeCode, timestamp } = record;
    const { dateString, timeOnly } =
      this.dateCalculator.calculateWorkDate(timestamp);

    // Check for existing record for this work date
    const existingRecord = await this.recordHandler.getExistingRecord(
      employeeCode,
      dateString,
    );

    if (!existingRecord) {
      // No existing record for this work date = Check-in
      const employee = await this.recordHandler.getEmployee(employeeCode);

      if (!employee) {
        this.logger.warn(
          `❌ Employee with ID ${employeeCode} not found in database`,
        );
        return;
      }

      await this.recordHandler.createNewRecord(
        employeeCode,
        timeOnly,
        dateString,
      );
    } else {
      // Record exists for this work date
      if (existingRecord.check_in && !existingRecord.check_out) {
        // Has check-in but no check-out = Check-out
        await this.recordHandler.updateCheckoutTime(
          existingRecord.id,
          timeOnly,
        );
      } else if (existingRecord.check_in && existingRecord.check_out) {
        // Has both check-in and check-out = Update check-out time
        await this.recordHandler.updateCheckoutTime(
          existingRecord.id,
          timeOnly,
        );
      } else {
        // Edge case: record exists but no check-in time = Update check-in
        await this.recordHandler.updateCheckinTime(existingRecord.id, timeOnly);
      }
    }
  }

  /**
   * Main method to process attendance data
   */
  async processAttendance(
    data: string,
  ): Promise<{ message: string; processed: number }> {
    const attendanceRecords = this.dataParser.parseAttendanceData(data);

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
}
