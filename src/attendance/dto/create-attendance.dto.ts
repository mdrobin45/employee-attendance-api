import { attendance_status } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsDate()
  @IsNotEmpty()
  date: Date;

  @IsDate()
  @IsNotEmpty()
  check_in: Date;

  @IsDate()
  @IsNotEmpty()
  check_out: Date;

  @IsEnum(attendance_status)
  @IsNotEmpty()
  status: attendance_status;

  @IsString()
  @IsOptional()
  remarks?: string;
}
