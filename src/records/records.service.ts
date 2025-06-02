import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface dtoTypes {
  date: Date;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  employeeId: string;
}
@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: dtoTypes, userEmail: string) {
    const user = await this.prisma.employee.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error(`Employee with email ${userEmail} not found`);
    }

    return this.prisma.record.create({
      data: {
        date: new Date(dto.date),
        clockIn: dto.clockIn,
        clockOut: dto.clockOut,
        totalHours: dto.totalHours,
        employeeId: Number(dto.employeeId),
      },
    });
  }

  async findAllByEmail(email: string) {
    const user = await this.prisma.employee.findUnique({ where: { email } });
    if (!user) {
      throw new Error(`Employee with email ${email} not found`);
    }
    return this.prisma.record.findMany({ where: { employeeId: user.id } });
  }
}
