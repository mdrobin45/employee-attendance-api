import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() employeeData: CreateEmployeeDto) {
    return this.employeesService.create(employeeData);
  }

  @Get()
  getAll() {
    return this.employeesService.getAll();
  }
}
