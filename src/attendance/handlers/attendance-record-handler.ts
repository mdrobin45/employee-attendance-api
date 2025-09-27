import { Injectable } from '@nestjs/common';
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
    timeOnly: string,
    dateString: string,
  ): Promise<void> {
    const employee = await this.getEmployee(employeeCode);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeCode} not found`);
    }

    await this.prisma.attendance_records.create({
      data: {
        employee_id: employee.id,
        check_in: timeOnly,
        check_out: null,
        date: dateString,
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
