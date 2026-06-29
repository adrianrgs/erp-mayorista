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

  @Post('room-types')
  createRoomType(@Body() dto: any) { return this.service.createRoomType(dto); }

  @Patch('room-types/:id')
  updateRoomType(@Param('id') id: string, @Body() dto: any) { return this.service.updateRoomType(id, dto); }

  @Delete('room-types/:id')
  removeRoomType(@Param('id') id: string) { return this.service.removeRoomType(id); }

  @Get('rate-plans')
  findRatePlans(@Query('propertyId') propertyId?: string) { return this.service.findRatePlans(propertyId); }

  @Post('rate-plans')
  createRatePlan(@Body() dto: any) { return this.service.createRatePlan(dto); }

  @Patch('rate-plans/:id')
  updateRatePlan(@Param('id') id: string, @Body() dto: any) { return this.service.updateRatePlan(id, dto); }

  @Delete('rate-plans/:id')
  removeRatePlan(@Param('id') id: string) { return this.service.removeRatePlan(id); }

  @Get('stop-sales')
  findStopSales() { return this.service.findStopSales(); }

  @Post('stop-sales')
  createStopSale(@Body() dto: any) { return this.service.createStopSale(dto); }

  @Patch('stop-sales/:id')
  updateStopSale(@Param('id') id: string, @Body() dto: any) { return this.service.updateStopSale(id, dto); }

  @Delete('stop-sales/:id')
  removeStopSale(@Param('id') id: string) { return this.service.removeStopSale(id); }

  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
