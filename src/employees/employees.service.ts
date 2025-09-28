import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(readonly prisma: PrismaService) {}

  async create(employeeData: CreateEmployeeDto) {
    const employee = await this.prisma.employees.create({
      data: employeeData,
    });
    if (!employee) {
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
