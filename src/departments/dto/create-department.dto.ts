import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDate()
  @IsNotEmpty()
  shift_start: Date;

  @IsDate()
  @IsNotEmpty()
  shift_end: Date;
}
