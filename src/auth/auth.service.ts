import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.employee.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }
    const isPasswordValid = await bcrypt.compare(pass, user.password as string);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login credentials');
    }
    return user;
  }

  login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        name: user.name,
        email: user.email,
        department: user.department,
      },
    };
  }
}
