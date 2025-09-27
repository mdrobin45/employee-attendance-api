import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import {
  AttendanceDataParser,
  AttendanceProcessor,
  AttendanceRecordHandler,
  WorkDateCalculator,
} from './handlers';

@Module({
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceDataParser,
    WorkDateCalculator,
    AttendanceRecordHandler,
    AttendanceProcessor,
    PrismaService,
  ],
})
export class AttendanceModule {}
