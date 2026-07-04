import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly service: FinancesService) {}

  // ── Existing: Invoices ────────────────────────────────────────────────────
  @Get('invoices')
  findAllInvoices() { return this.service.findAllInvoices(); }

  @Post('invoices')
  createInvoice(@Body() dto: any) { return this.service.createInvoice(dto); }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() dto: any) { return this.service.updateInvoice(id, dto); }

  @Delete('invoices/:id')
  deleteInvoice(@Param('id') id: string) { return this.service.deleteInvoice(id); }

  // ── Existing: Vouchers ────────────────────────────────────────────────────
  @Get('vouchers')
  findAllVouchers() { return this.service.findAllVouchers(); }

  @Post('vouchers')
  createVoucher(@Body() dto: any) { return this.service.createVoucher(dto); }

  @Patch('vouchers/:id')
  updateVoucher(@Param('id') id: string, @Body() dto: any) { return this.service.updateVoucher(id, dto); }

  @Delete('vouchers/:id')
  deleteVoucher(@Param('id') id: string) { return this.service.deleteVoucher(id); }

  // ── Existing: Payable Obligations ─────────────────────────────────────────
  @Get('obligations')
  findAllObligations() { return this.service.findAllObligations(); }

  @Post('obligations')
  createObligation(@Body() dto: any) { return this.service.createObligation(dto); }

  @Patch('obligations/:id')
  updateObligation(@Param('id') id: string, @Body() dto: any) { return this.service.updateObligation(id, dto); }

  @Delete('obligations/:id')
  deleteObligation(@Param('id') id: string) { return this.service.deleteObligation(id); }

  // ── Existing: Provider Statements ────────────────────────────────────────
  @Get('statements')
  findAllStatements() { return this.service.findAllStatements(); }

  @Post('statements')
  createStatement(@Body() dto: any) { return this.service.createStatement(dto); }

  @Delete('statements/:id')
  deleteStatement(@Param('id') id: string) { return this.service.deleteStatement(id); }

  // ── Tax Jurisdiction (multi-country config) ───────────────────────────────
  @Get('jurisdiction')
  getJurisdiction() { return this.service.getJurisdiction(); }

  @Post('jurisdiction')
  upsertJurisdiction(@Body() dto: any) { return this.service.upsertJurisdiction(dto); }

  // ── Exchange Rates ────────────────────────────────────────────────────────
  @Get('exchange-rates')
  findAllExchangeRates() { return this.service.findAllExchangeRates(); }

  @Get('exchange-rates/today')
  getTodayRate(@Query('toCurrency') toCurrency: string) {
    return this.service.getTodayRate(toCurrency);
  }

  @Post('exchange-rates')
  createExchangeRate(@Body() dto: any) { return this.service.createExchangeRate(dto); }

  // ── Withholding Certificates ──────────────────────────────────────────────
  @Get('withholding-certificates')
  findAllWithholding() { return this.service.findAllWithholdingCertificates(); }

  @Post('withholding-certificates')
  createWithholding(@Body() dto: any) { return this.service.createWithholdingCertificate(dto); }

  @Delete('withholding-certificates/:id')
  deleteWithholding(@Param('id') id: string) { return this.service.deleteWithholdingCertificate(id); }

  // ── Journal Entries ───────────────────────────────────────────────────────
  @Get('journal-entries')
  findAllJournalEntries() { return this.service.findAllJournalEntries(); }

  @Post('journal-entries')
  createJournalEntry(@Body() dto: any) { return this.service.createJournalEntry(dto); }

  // ── Fiscal Registers (reports) ────────────────────────────────────────────
  @Get('sales-register')
  salesRegister(@Query('period') period: string) { return this.service.salesRegister(period); }

  @Get('purchase-register')
  purchaseRegister(@Query('period') period: string) { return this.service.purchaseRegister(period); }

  @Get('surcharge-register')
  surchargeRegister(@Query('period') period: string) { return this.service.surchargeRegister(period); }

  @Get('withholding-register')
  withholdingRegister(@Query('period') period: string) { return this.service.withholdingRegister(period); }
}
