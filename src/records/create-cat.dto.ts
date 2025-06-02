import { IsDate, IsInt, IsString } from 'class-validator';

export class CreateCatDto {
  @IsDate()
  date: Date;

  @IsString()
  clockIn: string;

  @IsString()
  clockOut: string;

  @IsInt()
  totalHours: number;

  @IsString()
  employeeId: string;
}
