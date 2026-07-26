import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  // Página global de auditoría (Fase 1). Devuelve { items, hasMore }.
  @Get()
  findPaged(@Query('limit') limit = '25', @Query('offset') offset = '0') {
    return this.service.findPaged(parseInt(limit, 10) || 25, parseInt(offset, 10) || 0);
  }

  // Historial de una entidad concreta (ej. un expediente), filtrado en la base.
  @Get('entidad/:entidadTipo/:entidadId')
  findByEntidad(
    @Param('entidadTipo') entidadTipo: string,
    @Param('entidadId') entidadId: string,
    @Query('limit') limit = '200',
    @Query('offset') offset = '0',
  ) {
    return this.service.findByEntidad(entidadTipo, entidadId, parseInt(limit, 10) || 200, parseInt(offset, 10) || 0);
  }

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
