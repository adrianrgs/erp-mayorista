import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('flights')
export class FlightsController {
  constructor(private readonly service: FlightsService) {}

  @Get('tickets')
  findAllTickets() { return this.service.findAllTickets(); }

  @Get('legs')
  findAllLegs() { return this.service.findAllLegs(); }

  @Post('parse-pnr')
  parsePnr(@Body() body: { rawText: string }) {
    return this.service.parsePnr(body.rawText);
  }

  @Post('tickets')
  createTicket(@Body() dto: any) { return this.service.createTicket(dto); }

  @Patch('tickets/:id')
  updateTicket(@Param('id') id: string, @Body() dto: any) { return this.service.updateTicket(id, dto); }

  @Delete('tickets/:id')
  removeTicket(@Param('id') id: string) { return this.service.removeTicket(id); }
}
