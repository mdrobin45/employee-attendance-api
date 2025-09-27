import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkDateCalculator {
  calculateWorkDate(timestamp: string) {
    const recordTime = new Date(timestamp);
    const workDate = new Date(recordTime);

    if (recordTime.getHours() <= 4) {
      workDate.setDate(recordTime.getDate() - 1);
    }

    const year = workDate.getFullYear();
    const month = String(workDate.getMonth() + 1).padStart(2, '0');
    const day = String(workDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const recordDate = new Date(
      year,
      workDate.getMonth(),
      workDate.getDate(),
      0,
      0,
      0,
      0,
    );

    const timeOnly = recordTime.toTimeString().split(' ')[0];

    return { recordTime, workDate, recordDate, timeOnly, dateString };
  }
}
