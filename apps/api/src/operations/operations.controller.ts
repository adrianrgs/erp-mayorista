import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  @Get('vehicles')
  findAllVehicles() { return this.service.findAllVehicles(); }

  @Post('vehicles')
  @RequierePermiso(Accion.CREAR, Modulo.OPERACIONES)
  createVehicle(@Body() dto: any) { return this.service.createVehicle(dto); }

  @Patch('vehicles/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.OPERACIONES)
  updateVehicle(@Param('id') id: string, @Body() dto: any) { return this.service.updateVehicle(id, dto); }

  @Delete('vehicles/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.OPERACIONES)
  removeVehicle(@Param('id') id: string) { return this.service.removeVehicle(id); }

  @Get('drivers')
  findAllDrivers() { return this.service.findAllDrivers(); }

  @Post('drivers')
  @RequierePermiso(Accion.CREAR, Modulo.OPERACIONES)
  createDriver(@Body() dto: any) { return this.service.createDriver(dto); }

  @Patch('drivers/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.OPERACIONES)
  updateDriver(@Param('id') id: string, @Body() dto: any) { return this.service.updateDriver(id, dto); }

  @Delete('drivers/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.OPERACIONES)
  removeDriver(@Param('id') id: string) { return this.service.removeDriver(id); }
}
