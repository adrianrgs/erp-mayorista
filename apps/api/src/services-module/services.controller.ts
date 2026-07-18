import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  @RequierePermiso(Accion.CREAR, Modulo.SERVICIOS_VARIOS)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  @RequierePermiso(Accion.EDITAR, Modulo.SERVICIOS_VARIOS)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.SERVICIOS_VARIOS)
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post('rates')
  @RequierePermiso(Accion.CREAR, Modulo.SERVICIOS_VARIOS)
  createRate(@Body() dto: any) { return this.service.createRate(dto); }

  @Patch('rates/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.SERVICIOS_VARIOS)
  updateRate(@Param('id') id: string, @Body() dto: any) { return this.service.updateRate(id, dto); }

  @Delete('rates/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.SERVICIOS_VARIOS)
  removeRate(@Param('id') id: string) { return this.service.removeRate(id); }
}
