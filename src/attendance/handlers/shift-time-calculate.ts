import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShiftTimeCalculate {
  constructor(private readonly prisma: PrismaService) {}

  async calculateShiftTime(employeeCode: string) {
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
    const shiftEnd = employeeWithDepartment?.department.shift_end;

    function toDate(time: string): Date {
      return new Date(`1970-01-01T${time}Z`);
    }

    const shift_start = toDate(shiftStart);
    const shift_end = toDate(shiftEnd);

    return { shift_start, shift_end };
  }
}
