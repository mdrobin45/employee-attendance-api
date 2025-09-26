import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Body() attendanceData: CreateAttendanceDto) {
    return this.attendanceService.create(attendanceData);
  }

  @Get('records')
  getDailyRecords(@Query('date') date: Date) {
    return this.attendanceService.getDailyAttendance(date);
  }

  @Get('records/:employee_id')
  getEmployeeRecords(
    @Param('employee_id') employee_id: string,
    @Query('from') from: Date,
    @Query('to') to: Date,
  ) {
    return this.attendanceService.getEmployeeRecords(employee_id, from, to);
  }

  @Get('absentees')
  getAbsentees(@Query('date') date: Date) {
    return this.attendanceService.getAbsentees(date);
  }

  @Get('latecomers')
  getLateComers(@Query('date') date: Date) {
    return this.attendanceService.getLateComers(date);
  }
}
