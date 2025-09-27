import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AttendanceDataParser {
  private readonly logger = new Logger(AttendanceDataParser.name);

  /**
   * Parse attendance data from request body
   */
  parseAttendanceData(body: string) {
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
}
