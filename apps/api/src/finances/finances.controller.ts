import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly service: FinancesService) {}

  @Get('invoices')
  findAllInvoices() { return this.service.findAllInvoices(); }

  @Post('invoices')
  createInvoice(@Body() dto: any) { return this.service.createInvoice(dto); }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() dto: any) { return this.service.updateInvoice(id, dto); }

  @Get('vouchers')
  findAllVouchers() { return this.service.findAllVouchers(); }

  @Post('vouchers')
  createVoucher(@Body() dto: any) { return this.service.createVoucher(dto); }

  @Patch('vouchers/:id')
  updateVoucher(@Param('id') id: string, @Body() dto: any) { return this.service.updateVoucher(id, dto); }

  @Get('obligations')
  findAllObligations() { return this.service.findAllObligations(); }

  @Post('obligations')
  createObligation(@Body() dto: any) { return this.service.createObligation(dto); }

  @Patch('obligations/:id')
  updateObligation(@Param('id') id: string, @Body() dto: any) { return this.service.updateObligation(id, dto); }

  @Get('statements')
  findAllStatements() { return this.service.findAllStatements(); }
}
