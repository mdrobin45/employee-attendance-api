import { Body, Controller, Get, Post } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  create(@Body() departmentData: CreateDepartmentDto) {
    return this.departmentsService.create(departmentData);
  }

  @Get()
  getAll() {
    return this.departmentsService.getAll();
  }
}
