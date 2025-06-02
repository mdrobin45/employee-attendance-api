import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateCatDto } from './create-cat.dto';
import { RecordsService } from './records.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Controller('records')
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('clock')
  create(@Request() req, @Body() body: CreateCatDto) {
    const email: string = String(req.user.email);
    return this.recordsService.create(body, email);
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.recordsService.findAllByEmail(String(req.user.email));
  }
}
