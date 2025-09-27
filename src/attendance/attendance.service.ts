import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { attendance_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AttendanceDataParser,
  AttendanceProcessor,
  AttendanceRecordHandler,
  WorkDateCalculator,
} from './handlers';
@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    readonly prisma: PrismaService,
    private readonly dataParser: AttendanceDataParser,
    private readonly dateCalculator: WorkDateCalculator,
    private readonly recordHandler: AttendanceRecordHandler,
    private readonly attendanceProcessor: AttendanceProcessor,
  ) {}

  /**
   * Create attendance record (public method for controller)
   */
  async create(attendanceData: string) {
    return this.attendanceProcessor.processAttendance(attendanceData);
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
