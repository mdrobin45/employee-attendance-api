import { Injectable } from '@nestjs/common';

@Injectable()
export class AttendanceDataParser {
  parseAttendanceData(body: string) {
    const lines = body.trim().split('\n');

    const attendanceRecords: {
      employeeCode: string;
      timestamp: string;
      fields: string[];
    }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const fields = line.split('\t');

      if (line.startsWith('USER')) continue;

      if (fields.length <= 11) {
        attendanceRecords.push({
          employeeCode: fields[0],
          timestamp: fields[1],
          fields,
        });
      }
    }
    return attendanceRecords;
  }
}
