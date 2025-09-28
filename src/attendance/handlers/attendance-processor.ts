import { Injectable } from '@nestjs/common';
import { AttendanceDataParser } from './attendance-data-parser';
import { AttendanceRecordHandler } from './attendance-record-handler';
import { ShiftTimeCalculate } from './shift-time-calculate';
import { WorkDateCalculator } from './work-date-calculator';

@Injectable()
export class AttendanceProcessor {
  constructor(
    private readonly dataParser: AttendanceDataParser,
    private readonly dateCalculator: WorkDateCalculator,
    private readonly recordHandler: AttendanceRecordHandler,
    private readonly shiftTimeCalculate: ShiftTimeCalculate,
  ) {}

  async processAttendanceRecord(record: {
    employeeCode: string;
    timestamp: string;
    fields: string[];
  }): Promise<void> {
    const { employeeCode, timestamp } = record;
    const { dateString, timeOnly } =
      this.dateCalculator.calculateWorkDate(timestamp);

    const existingRecord = await this.recordHandler.getExistingRecord(
      employeeCode,
      dateString,
    );

    const shiftTime =
      await this.shiftTimeCalculate.calculateShiftTime(employeeCode);
    if (!shiftTime?.shift_start || !shiftTime?.shift_end) {
      return;
    }

    if (!existingRecord) {
      const employee = await this.recordHandler.getEmployee(employeeCode);

      if (!employee) {
        return;
      }

      await this.recordHandler.createNewRecord(
        employeeCode,
        shiftTime.shift_start,
        timeOnly,
        dateString,
      );
    } else {
      if (existingRecord.check_in && !existingRecord.check_out) {
        await this.recordHandler.updateCheckoutTime(
          existingRecord.id,
          shiftTime.shift_end,
          timeOnly,
        );
      } else if (existingRecord.check_in && existingRecord.check_out) {
        await this.recordHandler.updateCheckoutTime(
          existingRecord.id,
          shiftTime.shift_end,
          timeOnly,
        );
      } else {
        await this.recordHandler.updateCheckinTime(
          existingRecord.id,
          shiftTime.shift_start,
          timeOnly,
        );
      }
    }
  }

  async processAttendance(data: string): Promise<string> {
    const attendanceRecords = this.dataParser.parseAttendanceData(data);

    for (const record of attendanceRecords) {
      try {
        await this.processAttendanceRecord(record);
      } catch {
        console.log(
          `Error processing record for employee ${record.employeeCode}`,
        );
      }
    }

    return 'OK';
  }
}
