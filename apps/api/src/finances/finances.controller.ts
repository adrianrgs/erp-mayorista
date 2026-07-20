import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequierePermiso } from '../auth/requiere-permiso.decorator';
import { Modulo, Accion } from '../auth/permisos';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly service: FinancesService) {}

  // ── Existing: Invoices (facturas/NC/abonos → facturación o cobranzas) ──────
  @Get('invoices')
  findAllInvoices() { return this.service.findAllInvoices(); }

  @Post('invoices')
  @RequierePermiso(Accion.CREAR, Modulo.FACTURACION, Modulo.COBRANZAS)
  createInvoice(@Body() dto: any) { return this.service.createInvoice(dto); }

  @Patch('invoices/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.FACTURACION, Modulo.COBRANZAS)
  updateInvoice(@Param('id') id: string, @Body() dto: any) { return this.service.updateInvoice(id, dto); }

  @Delete('invoices/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.FACTURACION, Modulo.COBRANZAS)
  deleteInvoice(@Param('id') id: string) { return this.service.deleteInvoice(id); }

  // ── Existing: Vouchers (comprobantes de cobro → cobranzas) ─────────────────
  @Get('vouchers')
  findAllVouchers() { return this.service.findAllVouchers(); }

  @Post('vouchers')
  @RequierePermiso(Accion.CREAR, Modulo.COBRANZAS)
  createVoucher(@Body() dto: any) { return this.service.createVoucher(dto); }

  @Patch('vouchers/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.COBRANZAS)
  updateVoucher(@Param('id') id: string, @Body() dto: any) { return this.service.updateVoucher(id, dto); }

  @Delete('vouchers/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.COBRANZAS)
  deleteVoucher(@Param('id') id: string) { return this.service.deleteVoucher(id); }

  // ── Existing: Payable Obligations (cuentas por pagar) ──────────────────────
  @Get('obligations')
  findAllObligations() { return this.service.findAllObligations(); }

  @Post('obligations')
  @RequierePermiso(Accion.CREAR, Modulo.CUENTAS_PAGAR, Modulo.FACTURACION)
  createObligation(@Body() dto: any) { return this.service.createObligation(dto); }

  @Patch('obligations/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.CUENTAS_PAGAR, Modulo.FACTURACION)
  updateObligation(@Param('id') id: string, @Body() dto: any) { return this.service.updateObligation(id, dto); }

  @Delete('obligations/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.CUENTAS_PAGAR)
  deleteObligation(@Param('id') id: string) { return this.service.deleteObligation(id); }

  // ── Existing: Provider Statements ────────────────────────────────────────
  @Get('statements')
  findAllStatements() { return this.service.findAllStatements(); }

  @Post('statements')
  @RequierePermiso(Accion.CREAR, Modulo.CUENTAS_PAGAR)
  createStatement(@Body() dto: any) { return this.service.createStatement(dto); }

  @Delete('statements/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.CUENTAS_PAGAR)
  deleteStatement(@Param('id') id: string) { return this.service.deleteStatement(id); }

  // ── Tax Jurisdiction (config multi-país → solo administrador) ──────────────
  @Get('jurisdiction')
  getJurisdiction() { return this.service.getJurisdiction(); }

  @Post('jurisdiction')
  @RequierePermiso(Accion.EDITAR, Modulo.CONFIGURACION)
  upsertJurisdiction(@Body() dto: any) { return this.service.upsertJurisdiction(dto); }

  // ── Exchange Rates ────────────────────────────────────────────────────────
  @Get('exchange-rates')
  findAllExchangeRates() { return this.service.findAllExchangeRates(); }

  @Get('exchange-rates/today')
  getTodayRate(@Query('toCurrency') toCurrency: string) {
    return this.service.getTodayRate(toCurrency);
  }

  @Post('exchange-rates')
  @RequierePermiso(Accion.CREAR, Modulo.CONTABILIDAD, Modulo.ADMINISTRACION)
  createExchangeRate(@Body() dto: any) { return this.service.createExchangeRate(dto); }

  // ── Custom Rates (tasas personalizables) ──────────────────────────────────
  @Get('custom-rates')
  findAllCustomRates() { return this.service.findAllCustomRates(); }

  @Post('custom-rates')
  @RequierePermiso(Accion.EDITAR, Modulo.CONFIGURACION, Modulo.ADMINISTRACION)
  upsertCustomRate(@Body() dto: any) { return this.service.upsertCustomRate(dto); }

  @Delete('custom-rates/:id')
  @RequierePermiso(Accion.EDITAR, Modulo.CONFIGURACION, Modulo.ADMINISTRACION)
  deleteCustomRate(@Param('id') id: string) { return this.service.deleteCustomRate(id); }

  // ── Wallet Transactions (billetera del cliente) ───────────────────────────
  @Get('wallet-transactions')
  findAllWalletTransactions() { return this.service.findAllWalletTransactions(); }

  @Post('wallet-transactions')
  @RequierePermiso(Accion.CREAR, Modulo.COBRANZAS, Modulo.CLIENTES)
  createWalletTransaction(@Body() dto: any) { return this.service.createWalletTransaction(dto); }

  @Delete('wallet-transactions/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.COBRANZAS, Modulo.CLIENTES)
  deleteWalletTransaction(@Param('id') id: string) { return this.service.deleteWalletTransaction(id); }

  // ── Withholding Certificates ──────────────────────────────────────────────
  @Get('withholding-certificates')
  findAllWithholding() { return this.service.findAllWithholdingCertificates(); }

  @Post('withholding-certificates')
  @RequierePermiso(Accion.CREAR, Modulo.CONTABILIDAD, Modulo.FACTURACION)
  createWithholding(@Body() dto: any) { return this.service.createWithholdingCertificate(dto); }

  @Delete('withholding-certificates/:id')
  @RequierePermiso(Accion.ELIMINAR, Modulo.CONTABILIDAD)
  deleteWithholding(@Param('id') id: string) { return this.service.deleteWithholdingCertificate(id); }

  // ── Journal Entries ───────────────────────────────────────────────────────
  @Get('journal-entries')
  findAllJournalEntries() { return this.service.findAllJournalEntries(); }

  @Post('journal-entries')
  @RequierePermiso(Accion.CREAR, Modulo.CONTABILIDAD)
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
