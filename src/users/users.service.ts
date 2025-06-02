import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createEmployee(
    email: string,
    password: string,
    name: string,
    department: string,
  ) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.employee.create({
      data: {
        email,
        password: hash,
        name,
        department,
      },
    });
  }
}
