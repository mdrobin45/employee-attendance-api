import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(readonly prisma: PrismaService) {}

  async create(employeeData: CreateEmployeeDto) {
    // Check if exist
    const employee = await this.prisma.employees.findUnique({
      where: {
        employee_code: employeeData?.employee_code,
      },
    });

    if (employee)
      throw new HttpException('Employee already exist', HttpStatus.CONFLICT);

    const newEmployee = await this.prisma.employees.create({
      data: employeeData,
    });
    if (!newEmployee) {
      throw new BadRequestException('Failed to create employee');
    }
    return {
      message: 'Employee created',
      status: 'success',
    };
  }

  async getAll() {
    return await this.prisma.employees.findMany();
  }
}
