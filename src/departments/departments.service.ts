import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(readonly prisma: PrismaService) {}

  async create(departmentData: CreateDepartmentDto) {
    return await this.prisma.departments.create({
      data: departmentData,
    });
  }
  async getDepartmentList() {
    return await this.prisma.departments.findMany({
      select: { id: true, name: true },
    });
  }

  async getAll() {
    return await this.prisma.departments.findMany();
  }
}
