import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('room-types')
  findRoomTypes(@Query('propertyId') propertyId?: string) { return this.service.findRoomTypes(propertyId); }

  @Post('room-types')
  @RequierePermiso(Accion.CREAR, Modulo.PROPIEDADES)
  createRoomType(@Body() dto: any) { return this.service.createRoomType(dto); }

  @Patch('room-types/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.PROPIEDADES)
  updateRoomType(@Param('id') id: string, @Body() dto: any) { return this.service.updateRoomType(id, dto); }

  @Delete('room-types/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.PROPIEDADES)
  removeRoomType(@Param('id') id: string) { return this.service.removeRoomType(id); }

  @Get('rate-plans')
  findRatePlans(@Query('propertyId') propertyId?: string) { return this.service.findRatePlans(propertyId); }

  @Post('rate-plans')
  @RequierePermiso(Accion.CREAR, Modulo.PROPIEDADES)
  createRatePlan(@Body() dto: any) { return this.service.createRatePlan(dto); }

  @Patch('rate-plans/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.PROPIEDADES)
  updateRatePlan(@Param('id') id: string, @Body() dto: any) { return this.service.updateRatePlan(id, dto); }

  @Delete('rate-plans/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.PROPIEDADES)
  removeRatePlan(@Param('id') id: string) { return this.service.removeRatePlan(id); }

  @Get('stop-sales')
  findStopSales() { return this.service.findStopSales(); }

  @Post('stop-sales')
  @RequierePermiso(Accion.CREAR, Modulo.PROPIEDADES)
  createStopSale(@Body() dto: any) { return this.service.createStopSale(dto); }

  @Patch('stop-sales/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.PROPIEDADES)
  updateStopSale(@Param('id') id: string, @Body() dto: any) { return this.service.updateStopSale(id, dto); }

  @Delete('stop-sales/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.PROPIEDADES)
  removeStopSale(@Param('id') id: string) { return this.service.removeStopSale(id); }

  @Post()
  @RequierePermiso(Accion.CREAR, Modulo.PROPIEDADES)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  @RequierePermiso(Accion.EDITAR, Modulo.PROPIEDADES)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.PROPIEDADES)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
