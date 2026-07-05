import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post('rates')
  createRate(@Body() dto: any) { return this.service.createRate(dto); }

  @Patch('rates/:id')
  updateRate(@Param('id') id: string, @Body() dto: any) { return this.service.updateRate(id, dto); }

  @Delete('rates/:id')
  removeRate(@Param('id') id: string) { return this.service.removeRate(id); }
}
