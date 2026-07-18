import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

// El borrado real de un usuario es posible (DELETE), pero los resguardos de negocio
// (no auto-eliminarse, no eliminar al último Administrador activo) viven en el frontend
// (handleDeleteUsuario, src/App.tsx), igual que el patrón ya usado para Roles — este
// endpoint no valida nada de eso, solo ejecuta el borrado.
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  @RequierePermiso(Accion.CREAR, Modulo.CONFIGURACION)
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  @RequierePermiso(Accion.EDITAR, Modulo.CONFIGURACION)
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.CONFIGURACION)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
