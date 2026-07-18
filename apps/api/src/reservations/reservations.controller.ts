import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequierePermiso(Accion.CREAR, Modulo.RESERVAS)
  create(@Body() dto: CreateReservationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequierePermiso(Accion.EDITAR, Modulo.RESERVAS)
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.RESERVAS)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
