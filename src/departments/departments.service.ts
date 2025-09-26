import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(readonly prisma: PrismaService) {}

  async create(departmentData: CreateDepartmentDto) {
    return await this.prisma.departments.create({
      data: departmentData,
    });
  }

  async getAll() {
    return await this.prisma.departments.findMany();
  }
}
