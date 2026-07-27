import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  // Búsqueda server-side por nombre (Fase 2 del selector modal de proveedores).
  @Get('search')
  search(@Query('q') q = '', @Query('limit') limit = '25') {
    return this.service.search(q, parseInt(limit, 10) || 25);
  }

  @Post()
  @RequierePermiso(Accion.CREAR, Modulo.PROVEEDORES)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  @RequierePermiso(Accion.EDITAR, Modulo.PROVEEDORES)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.PROVEEDORES)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
