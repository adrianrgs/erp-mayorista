import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AutorizacionesService } from './autorizaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('autorizaciones')
export class AutorizacionesController {
  constructor(private readonly service: AutorizacionesService) {}

  @Get('reglas')
  findAllReglas() { return this.service.findAllReglas(); }

  @Post('reglas')
  createRegla(@Body() dto: any) { return this.service.createRegla(dto); }

  @Patch('reglas/:id')
  updateRegla(@Param('id') id: string, @Body() dto: any) { return this.service.updateRegla(id, dto); }

  @Get('solicitudes')
  findAllSolicitudes() { return this.service.findAllSolicitudes(); }

  @Post('solicitudes')
  createSolicitud(@Body() dto: any) { return this.service.createSolicitud(dto); }

  @Patch('solicitudes/:id')
  resolveSolicitud(@Param('id') id: string, @Body() dto: any) { return this.service.resolveSolicitud(id, dto); }
}
