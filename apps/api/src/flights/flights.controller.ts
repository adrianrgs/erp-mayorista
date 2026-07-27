import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('flights')
export class FlightsController {
  constructor(private readonly service: FlightsService) {}

  @Get('tickets')
  findAllTickets(@Query('since') since?: string, @Query('limit') limit?: string) {
    return this.service.findAllTickets(since, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('legs')
  findAllLegs() { return this.service.findAllLegs(); }

  // Point-read por id (buscador directo). Devuelve el boleto o null (200) si no existe.
  @Get('tickets/:id')
  findTicketById(@Param('id') id: string) { return this.service.findTicketById(id); }

  @Post('parse-pnr')
  parsePnr(@Body() body: { rawText: string }) {
    return this.service.parsePnr(body.rawText);
  }

  @Post('tickets')
  @RequierePermiso(Accion.CREAR, Modulo.VUELOS)
  createTicket(@Body() dto: any) { return this.service.createTicket(dto); }

  @Patch('tickets/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.VUELOS)
  updateTicket(@Param('id') id: string, @Body() dto: any) { return this.service.updateTicket(id, dto); }

  @Delete('tickets/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.VUELOS)
  removeTicket(@Param('id') id: string) { return this.service.removeTicket(id); }
}
