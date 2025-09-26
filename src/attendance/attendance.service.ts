import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { attendance_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
@Injectable()
export class AttendanceService {
  constructor(readonly prisma: PrismaService) {}

  async create(attendanceData: CreateAttendanceDto) {
    return await this.prisma.attendance_records.create({
      data: attendanceData,
    });
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
    const attendance = await this.prisma.attendance_records.findMany({
      where: {
        date: yesterday,
      },
    });
  }
}
