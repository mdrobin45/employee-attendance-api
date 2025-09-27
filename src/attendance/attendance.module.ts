import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import {
  AttendanceDataParser,
  AttendanceProcessor,
  AttendanceRecordHandler,
  WorkDateCalculator,
} from './handlers';

@Module({
  imports: [ScheduleModule.forRoot()],
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
