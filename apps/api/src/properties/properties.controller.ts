import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('room-types')
  findRoomTypes(@Query('propertyId') propertyId?: string) { return this.service.findRoomTypes(propertyId); }

  @Get('rate-plans')
  findRatePlans(@Query('propertyId') propertyId?: string) { return this.service.findRatePlans(propertyId); }

  @Get('stop-sales')
  findStopSales() { return this.service.findStopSales(); }

  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
