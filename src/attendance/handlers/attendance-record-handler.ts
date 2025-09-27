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
      throw new Error(`Employee with ID ${employeeCode} not found`);
    }

    return await this.prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        date: dateString,
      },
    });
  }

  async createNewRecord(
    employeeCode: string,
    employeeId: string,
    timeOnly: string,
    dateString: string,
  ): Promise<void> {
    const employee = await this.getEmployee(employeeCode);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeCode} not found`);
    }
    // Get employee along with department info by joining employee and department
    const employeeWithDepartment = await this.prisma.employees.findUnique({
      where: {
        employee_code: employeeCode,
      },
      include: {
        department: true,
      },
    });

    if (!employeeWithDepartment?.department) return;
    const shiftStart = employeeWithDepartment?.department.shift_start;

    function toDate(time: string): Date {
      return new Date(`1970-01-01T${time}Z`);
    }

    const shiftDate = toDate(shiftStart);
    const checkInDate = toDate(timeOnly);
    const isLate = checkInDate > shiftDate;
    console.log('Is Late', isLate);

    await this.prisma.attendance_records.create({
      data: {
        employee_id: employee.id,
        check_in: timeOnly,
        check_out: null,
        date: dateString,
        status: isLate ? attendance_status.late : attendance_status.present,
      },
    });
  }

  async updateCheckoutTime(
    recordId: string,
    checkoutTime: string,
  ): Promise<void> {
    await this.prisma.attendance_records.update({
      where: { id: recordId },
      data: { check_out: checkoutTime },
    });
  }

  async updateCheckinTime(
    recordId: string,
    checkinTime: string,
  ): Promise<void> {
    await this.prisma.attendance_records.update({
      where: { id: recordId },
      data: { check_in: checkinTime },
    });
  }
}
