import { Injectable } from '@nestjs/common';
import { attendance_status } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceRecordHandler {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployee(employeeCode: string) {
    return await this.prisma.employees.findUnique({
      where: {
        employee_code: employeeCode,
      },
    });
  }

  async getExistingRecord(employeeCode: string, dateString: string) {
    const employee = await this.getEmployee(employeeCode);
    if (!employee) {
      console.log(`Employee with ID ${employeeCode} not found`);
      return null;
    }

    return await this.prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        date: dateString,
      },
    });
  }

  private toDate(time: string): Date {
    return new Date(`1970-01-01T${time}Z`);
  }

  async createNewRecord(
    employeeCode: string,
    shift_start: Date,
    timeOnly: string,
    dateString: string,
  ): Promise<void> {
    const employee = await this.getEmployee(employeeCode);
    if (!employee) {
      console.log(`Employee with ID ${employeeCode} not found`);
      return;
    }

    const checkInDate = this.toDate(timeOnly);
    const isLate = checkInDate > shift_start;

    await this.prisma.attendance_records.create({
      data: {
        employee_id: employee.id,
        check_in: timeOnly,
        check_out: null,
        date: dateString,
        status: isLate ? attendance_status.late : attendance_status.present,
      },
    });
    console.log(`CheckIn time inserted for employee ${employeeCode}`);
  }

  async updateCheckoutTime(
    recordId: string,
    shift_end: Date,
    checkoutTime: string,
  ): Promise<void> {
    const checkOutDate = this.toDate(checkoutTime);
    const isEarlyExit = checkOutDate < shift_end;

    // Get current status
    const existingRecord = await this.prisma.attendance_records.findUnique({
      where: { id: recordId },
    });

    await this.prisma.attendance_records.update({
      where: { id: recordId },
      data: {
        check_out: checkoutTime,
        status: isEarlyExit
          ? attendance_status.early_exit
          : existingRecord?.status,
      },
    });
    console.log(`CheckOut time updated for employee ${recordId}`);
  }

  async updateCheckinTime(
    recordId: string,
    shift_start: Date,
    checkinTime: string,
  ): Promise<void> {
    const checkInDate = this.toDate(checkinTime);
    const isLate = checkInDate > shift_start;

    // Get current status
    const existingRecord = await this.prisma.attendance_records.findUnique({
      where: { id: recordId },
    });

    await this.prisma.attendance_records.update({
      where: { id: recordId },
      data: {
        check_in: checkinTime,
        status: isLate ? attendance_status.late : existingRecord?.status,
      },
    });
    console.log(`CheckIn time updated for employee ${recordId}`);
  }
}
