import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { parseJsonField } from '../shared/parse-json.util';

@Injectable()
export class FinancesService {
  constructor(private readonly dc: DataConnectService) {}

  // ── Invoices ──────────────────────────────────────────────────────────────

  async findAllInvoices() {
    const data = await this.dc.executeQuery<{ financialInvoices: any[] }>('ListInvoices');
    return data.financialInvoices || [];
  }

  async createInvoice(dto: any) {
    await this.dc.executeMutation('InsertInvoice', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateInvoice(id: string, dto: any) {
    await this.dc.executeMutation('UpdateInvoice', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async deleteInvoice(id: string) {
    await this.dc.executeMutation('DeleteInvoice', { id });
    return { success: true };
  }

  // ── Payment Vouchers ──────────────────────────────────────────────────────

  async findAllVouchers() {
    const data = await this.dc.executeQuery<{ paymentVouchers: any[] }>('ListPaymentVouchers');
    return data.paymentVouchers || [];
  }

  async createVoucher(dto: any) {
    const { id, clientId, clientName, invoiceId, locatorId, method, reference, amount, date, status, bankName, notes, attachedFile } = dto;
    await this.dc.executeMutation('InsertPaymentVoucher', {
      id, clientId, clientName, invoiceId, locatorId, method, reference, amount, date, status, bankName, notes, attachedFile,
    });
    return { success: true, id };
  }

  async updateVoucher(id: string, dto: any) {
    await this.dc.executeMutation('UpdatePaymentVoucher', { id, status: dto.status });
    return { success: true };
  }

  async deleteVoucher(id: string) {
    await this.dc.executeMutation('DeletePaymentVoucher', { id });
    return { success: true };
  }

  // ── Payable Obligations ───────────────────────────────────────────────────

  async findAllObligations() {
    const data = await this.dc.executeQuery<{ payableObligations: any[] }>('ListPayableObligations');
    return data.payableObligations || [];
  }

  async createObligation(dto: any) {
    await this.dc.executeMutation('InsertPayableObligation', {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }

  async updateObligation(id: string, dto: any) {
    await this.dc.executeMutation('UpdatePayableObligation', {
      id, ...dto,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  }

  async deleteObligation(id: string) {
    await this.dc.executeMutation('DeletePayableObligation', { id });
    return { success: true };
  }

  // ── Provider Statements ───────────────────────────────────────────────────

  async findAllStatements() {
    const data = await this.dc.executeQuery<{ providerStatements: any[] }>('ListProviderStatements');
    return data.providerStatements || [];
  }

  async createStatement(dto: any) {
    const { id, providerName, date, type, amount, reference, status } = dto;
    await this.dc.executeMutation('InsertProviderStatement', {
      id, providerName, date, type, amount, reference, status,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id };
  }

  async deleteStatement(id: string) {
    await this.dc.executeMutation('DeleteProviderStatement', { id });
    return { success: true };
  }

  // ── Tax Jurisdiction ──────────────────────────────────────────────────────

  async getJurisdiction() {
    const data = await this.dc.executeQuery<{ taxJurisdictions: any[] }>('ListTaxJurisdictions');
    const list = data.taxJurisdictions || [];
    const record = list[0];
    if (!record) return null;
    return {
      ...record,
      surchargePaymentMethods: parseJsonField(record.surchargePaymentMethods, []),
      vatWithholdingOptions: parseJsonField(record.vatWithholdingOptions, []),
      incomeTaxWithholdingOptions: parseJsonField(record.incomeTaxWithholdingOptions, []),
    };
  }

  async upsertJurisdiction(dto: any) {
    await this.dc.executeMutation('UpsertTaxJurisdiction', {
      ...dto,
      surchargePaymentMethods: JSON.stringify(dto.surchargePaymentMethods ?? []),
      vatWithholdingOptions: JSON.stringify(dto.vatWithholdingOptions ?? []),
      incomeTaxWithholdingOptions: JSON.stringify(dto.incomeTaxWithholdingOptions ?? []),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  }

  // ── Exchange Rates ────────────────────────────────────────────────────────

  async findAllExchangeRates() {
    const data = await this.dc.executeQuery<{ exchangeRates: any[] }>('ListExchangeRates');
    return data.exchangeRates || [];
  }

  async getTodayRate(toCurrency = 'VES') {
    const today = new Date().toISOString().slice(0, 10);
    const all = await this.findAllExchangeRates();
    return all.find((r) => r.date === today && r.toCurrency === toCurrency) ?? null;
  }

  async createExchangeRate(dto: any) {
    await this.dc.executeMutation('InsertExchangeRate', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  // ── Custom Rates (tasas personalizables definidas por el usuario) ──────────

  async findAllCustomRates() {
    const data = await this.dc.executeQuery<{ customRates: any[] }>('ListCustomRates');
    return data.customRates || [];
  }

  async upsertCustomRate(dto: any) {
    await this.dc.executeMutation('UpsertCustomRate', {
      id: dto.id,
      label: dto.label,
      fromCurrency: dto.fromCurrency ?? 'USD',
      toCurrency: dto.toCurrency,
      value: dto.value,
      showInHeader: dto.showInHeader ?? true,
      sortOrder: dto.sortOrder ?? 0,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }

  async deleteCustomRate(id: string) {
    await this.dc.executeMutation('DeleteCustomRate', { id });
    return { success: true };
  }

  // ── Wallet Transactions (billetera del cliente) ───────────────────────────

  async findAllWalletTransactions() {
    const data = await this.dc.executeQuery<{ walletTransactions: any[] }>('ListWalletTransactions');
    return data.walletTransactions || [];
  }

  async createWalletTransaction(dto: any) {
    await this.dc.executeMutation('InsertWalletTransaction', {
      id: dto.id,
      clientId: dto.clientId,
      clientKind: dto.clientKind ?? 'B2B',
      clientName: dto.clientName ?? '',
      type: dto.type,
      amount: dto.amount,
      office: dto.office ?? null,
      method: dto.method ?? null,
      reference: dto.reference ?? null,
      notes: dto.notes ?? null,
      reservationId: dto.reservationId ?? null,
      voucherId: dto.voucherId ?? null,
      date: dto.date,
      createdBy: dto.createdBy ?? null,
      createdAt: dto.createdAt ?? new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }

  async deleteWalletTransaction(id: string) {
    await this.dc.executeMutation('DeleteWalletTransaction', { id });
    return { success: true };
  }

  // ── Withholding Certificates ──────────────────────────────────────────────

  async findAllWithholdingCertificates() {
    const data = await this.dc.executeQuery<{ withholdingCertificates: any[] }>('ListWithholdingCertificates');
    return data.withholdingCertificates || [];
  }

  async createWithholdingCertificate(dto: any) {
    await this.dc.executeMutation('InsertWithholdingCertificate', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async deleteWithholdingCertificate(id: string) {
    await this.dc.executeMutation('DeleteWithholdingCertificate', { id });
    return { success: true };
  }

  // ── Journal Entries ───────────────────────────────────────────────────────

  async findAllJournalEntries() {
    const data = await this.dc.executeQuery<{ journalEntries: any[] }>('ListJournalEntries');
    return (data.journalEntries || []).map((e) => ({
      ...e,
      lines: parseJsonField(e.lines, []),
    }));
  }

  async createJournalEntry(dto: any) {
    await this.dc.executeMutation('InsertJournalEntry', {
      ...dto,
      lines: JSON.stringify(dto.lines ?? []),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }

  // ── Fiscal Registers (report aggregations) ────────────────────────────────

  async salesRegister(period: string) {
    const invoices = await this.findAllInvoices();
    return invoices.filter((inv) => {
      if (!period) return true;
      const [month, year] = period.split('-');
      return inv.date?.startsWith(`${year}-${month}`);
    });
  }

  async purchaseRegister(period: string) {
    const obligations = await this.findAllObligations();
    return obligations.filter((o) => {
      if (!period) return true;
      const [month, year] = period.split('-');
      return o.date?.startsWith(`${year}-${month}`);
    });
  }

  async surchargeRegister(period: string) {
    const invoices = await this.findAllInvoices();
    return invoices
      .filter((inv) => {
        if (!period) return true;
        const [month, year] = period.split('-');
        return inv.date?.startsWith(`${year}-${month}`);
      })
      .filter((inv) => (inv.surchargeAmount ?? 0) > 0)
      .map((inv) => ({
        date: inv.date,
        reference: inv.id,
        clientName: inv.clientName,
        paymentMethod: inv.paymentMethod,
        amount: inv.amount,
        surchargeAmount: inv.surchargeAmount,
      }));
  }

  async withholdingRegister(period: string) {
    const certs = await this.findAllWithholdingCertificates();
    return certs.filter((c) => {
      if (!period) return true;
      return c.period === period;
    });
  }
}
