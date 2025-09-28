import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('iclock')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('cdata')
  create(@Body() payload: string) {
    return this.attendanceService.create(payload);
  }
  @Get('cdata')
  initialHandshake() {
    console.log('ZKTeco Connected');
    return 'OK';
  }

  @Get('getrequest')
  getRequest() {
    console.log('Device pinging...');
    return 'OK';
  }

  @Get('records')
  getDailyRecords(@Query('date') date: string) {
    return this.attendanceService.getDailyAttendance(date);
  }

  @Get('records/:employee_id')
  getEmployeeRecords(
    @Param('employee_id') employee_id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.attendanceService.getEmployeeRecords(employee_id, from, to);
  }

  @Get('absentees')
  getAbsentees(@Query('date') date: string) {
    return this.attendanceService.getAbsentees(date);
  }

  @Get('latecomers')
  getLateComers(@Query('date') date: string) {
    return this.attendanceService.getLateComers(date);
  }

  @Post('update-status')
  updateAttendanceStatus() {
    return this.attendanceService.updateAttendanceStatus();
  }
}
