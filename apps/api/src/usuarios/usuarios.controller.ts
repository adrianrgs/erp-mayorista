import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// El borrado real de un usuario es posible (DELETE), pero los resguardos de negocio
// (no auto-eliminarse, no eliminar al último Administrador activo) viven en el frontend
// (handleDeleteUsuario, src/App.tsx), igual que el patrón ya usado para Roles — este
// endpoint no valida nada de eso, solo ejecuta el borrado.
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
