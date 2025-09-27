import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttendanceRecordHandler {
  private readonly logger = new Logger(AttendanceRecordHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get employee information
   */
  async getEmployee(employeeCode: string) {
    try {
      return await this.prisma.employees.findUnique({
        where: {
          employee_code: employeeCode,
        },
      });
    } catch (error) {
      console.log(`Error finding employee ${employeeCode}`, error);
      throw error;
    }
  }

  /**
   * Get existing attendance record for employee on specific date
   */
  async getExistingRecord(employeeCode: string, dateString: string) {
    try {
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
    } catch (error) {
      console.log(
        `Error finding existing record for employee ${employeeCode}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create new attendance record (check-in)
   */
  async createNewRecord(
    employeeCode: string,
    timeOnly: string,
    dateString: string,
  ): Promise<void> {
    try {
      const employee = await this.getEmployee(employeeCode);
      if (!employee) {
        throw new Error(`Employee with ID ${employeeCode} not found`);
      }

      const newRecord = await this.prisma.attendance_records.create({
        data: {
          employee_id: employee.id,
          check_in: timeOnly,
          check_out: null,
          date: dateString,
        },
      });
      console.log(
        `✅ Created new record for employee ${employeeCode}`,
        newRecord,
      );
    } catch (error) {
      console.log(
        `❌ Error creating record for employee ${employeeCode}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update existing record with check-out time
   */
  async updateCheckoutTime(
    recordId: string,
    checkoutTime: string,
  ): Promise<void> {
    try {
      await this.prisma.attendance_records.update({
        where: { id: recordId },
        data: { check_out: checkoutTime },
      });
      console.log(`✅ Updated checkout time for record ${recordId}`);
    } catch (error) {
      console.log(
        `❌ Error updating checkout time for record ${recordId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update existing record with check-in time (edge case)
   */
  async updateCheckinTime(
    recordId: string,
    checkinTime: string,
  ): Promise<void> {
    try {
      await this.prisma.attendance_records.update({
        where: { id: recordId },
        data: { check_in: checkinTime },
      });
      console.log(`✅ Updated checkin time for record ${recordId}`);
    } catch (error) {
      console.log(
        `❌ Error updating checkin time for record ${recordId}`,
        error,
      );
      throw error;
    }
  }
}
