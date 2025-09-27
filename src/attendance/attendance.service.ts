import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { attendance_status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

    // Get all employees
    const allEmployees = await this.prisma.employees.findMany({
      select: { id: true, employee_code: true, name: true },
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const employee of allEmployees) {
      // Check if employee has an attendance record for yesterday
      const existingRecord = await this.prisma.attendance_records.findFirst({
        where: {
          employee_id: employee.id,
          date: yesterdayString,
        },
      });

      if (!existingRecord) {
        // No record exists - create new record with 'absent' status
        await this.prisma.attendance_records.create({
          data: {
            employee_id: employee.id,
            date: yesterdayString,
            check_in: '',
            check_out: null,
            work_hours: 0,
            status: attendance_status.absent,
            remarks: null,
          },
        });

        createdCount++;
      } else {
        // Record exists - check if we need to update status
        if (existingRecord.status === attendance_status.leave) {
          skippedCount++;
          continue;
        }

        // Only process records with null status
        if (existingRecord.status === null) {
          if (
            !existingRecord.check_in ||
            existingRecord.check_in.trim() === ''
          ) {
            // No check-in - update to absent
            await this.prisma.attendance_records.update({
              where: { id: existingRecord.id },
              data: { status: attendance_status.absent },
            });

            updatedCount++;
          } else {
            // Has check-in - update to present
            await this.prisma.attendance_records.update({
              where: { id: existingRecord.id },
              data: { status: attendance_status.present },
            });

            updatedCount++;
          }
        } else {
          skippedCount++;
        }
      }
    }

    this.logger.log(
      `Attendance status update completed for ${yesterdayString}. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`,
    );
  }
}
