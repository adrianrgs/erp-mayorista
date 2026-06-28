import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  @Get('vehicles')
  findAllVehicles() { return this.service.findAllVehicles(); }

  @Post('vehicles')
  createVehicle(@Body() dto: any) { return this.service.createVehicle(dto); }

  @Patch('vehicles/:id')
  updateVehicle(@Param('id') id: string, @Body() dto: any) { return this.service.updateVehicle(id, dto); }

  @Delete('vehicles/:id')
  removeVehicle(@Param('id') id: string) { return this.service.removeVehicle(id); }

  @Get('drivers')
  findAllDrivers() { return this.service.findAllDrivers(); }

  @Post('drivers')
  createDriver(@Body() dto: any) { return this.service.createDriver(dto); }

  @Patch('drivers/:id')
  updateDriver(@Param('id') id: string, @Body() dto: any) { return this.service.updateDriver(id, dto); }

  @Delete('drivers/:id')
  removeDriver(@Param('id') id: string) { return this.service.removeDriver(id); }
}
