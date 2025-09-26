import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(readonly prisma: PrismaService) {}

  async create(employeeData: CreateEmployeeDto) {
    return await this.prisma.employees.create({
      data: employeeData,
    });
  }

  async getAll() {
    return await this.prisma.employees.findMany();
  }
}
