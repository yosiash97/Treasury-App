import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { YieldsService } from './yields.service';
import { CreateYieldDto } from './dto/create-yield.dto';
import { UpdateYieldDto } from './dto/update-yield.dto';
import { YieldsQueryDto } from './dto/yields.dto';
@Controller('yields')
export class YieldsController {
  constructor(private readonly yieldsService: YieldsService) {}

  @Get()
  findAll(@Query() query: YieldsQueryDto) {
    if (query.month) {
      query.month = Number(query.month);
    }
    return this.yieldsService.getYields(query);
  }
}
