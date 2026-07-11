import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  // Borra el historial atado a una entidad concreta (p.ej. un expediente eliminado),
  // para que un ID reutilizado no herede la auditoría de la entidad anterior.
  @Delete('entidad/:entidadTipo/:entidadId')
  removeByEntidad(
    @Param('entidadTipo') entidadTipo: string,
    @Param('entidadId') entidadId: string,
  ) {
    return this.service.removeByEntidad(entidadTipo, entidadId);
  }

  // Borra todo el historial de un tipo de entidad (p.ej. todas las "Reserva"). Usado por el reset.
  @Delete('tipo/:entidadTipo')
  removeByTipo(@Param('entidadTipo') entidadTipo: string) {
    return this.service.removeByTipo(entidadTipo);
  }
}
