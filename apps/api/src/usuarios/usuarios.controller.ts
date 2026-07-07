import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Sin DELETE a propósito: un usuario nunca se borra (rompería referencias en
// RegistroAuditoria/SolicitudAutorizacion) — se desactiva vía PATCH { activo: false }.
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
}
